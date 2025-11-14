import { Router } from "express";
import { queryPG } from "../db/db";

const router = Router();

router.get("/", async (req, res) => {
    try {
        // parse + defaults
        let { tags, page = 1, limit = 10, sort_by = "date", order = "DESC", } = req.query;
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

        // tags -> array
        const tagList = tags
            ? String(tags)
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
            : [];

        // build WHERE and params dynamically so $ positions are correct
        const whereClauses = ["visible = true"];
        const params = [];

        if (tagList.length > 0) {
            params.push(tagList); // will be $1 if first param
            whereClauses.push(`domains = ANY($${params.length})`);
        }

        // total count query (respects same filters)
        const totalQuery = `SELECT COUNT(*)::int AS total FROM blogs WHERE ${whereClauses.join(
            " AND "
        )}`;
        const totalResult = await queryPG(totalQuery, params);
        const total = totalResult.rows.length ? totalResult.rows[0].total : 0;

        // now add pagination params (limit, offset) - their param indexes depend on previous params length
        params.push(limit); // e.g. $n
        params.push(offset); // $n+1

        const dataQuery = `
                SELECT *
                FROM blogs
                WHERE ${whereClauses.join(" AND ")}
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
