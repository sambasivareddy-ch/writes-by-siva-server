import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        // parse + defaults
        let { tags, page = 1, limit = 10, sort_by = "date", order = "DESC", include = false } = req.query;
        page = Number.parseInt(page, 10) || 1;
        limit = Number.parseInt(limit, 10) || 10;
        const offset = (page - 1) * limit;

        // sanitize/validate
        const sortMap = {
            date: "date",
            views: "views",
            reactions: "likes",
        };
        const sortColumn = sortMap[sort_by] || sortMap.date;

        order = String(order).toUpperCase();
        if (!["ASC", "DESC"].includes(order)) order = "DESC";

        // tags -> array of lowercase trimmed strings
        const tagList = tags
            ? String(tags)
                  .split(",")
                  .map((t) => t.trim().toLowerCase())
                  .filter(Boolean)
            : [];

        // build WHERE and params dynamically
        const whereClauses = [];
        const params = [];

        if (tagList.length > 0) {
            tagList.forEach(tag => {
                whereClauses.push(`domain ILIKE '%${tag}%'`);
            })
        }

        // total count query (respects same filters)
        const totalQuery = `SELECT COUNT(*)::int AS total FROM blogs WHERE visible = true AND (${whereClauses.join(
            include ? " AND ": " OR "
        )})`;
        const totalResult = await queryPG(totalQuery, params);
        const total = totalResult.rows.length ? totalResult.rows[0].total : 0;

        // add pagination params (limit, offset)
        params.push(limit);
        params.push(offset);

        const dataQuery = `
                SELECT *
                FROM blogs
                WHERE visible = true AND (${whereClauses.join(include ? " AND ": " OR ")})
                ORDER BY ${sortColumn} ${order}
                LIMIT $${params.length - 1} OFFSET $${params.length}
              `;

        const dataResult = await queryPG(dataQuery, params);

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const meta = {
            total,
            totalPages,
            page,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        };

        return res.status(200).json({
            success: true,
            meta,
            blogs: dataResult.rows,
        });
    } catch (err) {
        console.error("GET /blogs error:", err);
        return res.status(500).json({
            success: false,
            error: "Internal Server Error",
        });
    }
});

export default router;
