import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        let {
            tags,
            primary = null,
            page = 1,
            limit = 10,
            sort_by = "date",
            order = "DESC",
            include = "false",
        } = req.query;
        page = Number.parseInt(page, 10) || 1;
        limit = Number.parseInt(limit, 10) || 10;
        const offset = (page - 1) * limit;

        // sanitize sort/order
        const sortMap = {
            date: "date",
            views: "views",
            reactions: "likes", // adjust if your DB column is different
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

        // build WHERE and params safely (parameterized)
        const whereParts = ["visible = true"];
        const params = [];

        if (primary) {
          whereParts.push(`primary_category = ${primary}`)
        }

        if (tagList.length > 0) {
            // If your tags are stored as plain text within `domain` column:
            const tagClauses = tagList.map((tag) => {
                params.push(`%${tag}%`);
                return `domains ILIKE $${params.length}`;
            });
            const joiner =
                String(include).toLowerCase() === "true" ? " AND " : " OR ";
            whereParts.push(`(${tagClauses.join(joiner)})`);
        }

        const whereSQL = whereParts.join(" AND ");

        // total count (uses same params as filter; do NOT add limit/offset yet)
        const totalQuery = `SELECT COUNT(*)::int AS total FROM blogs WHERE ${whereSQL}`;
        const totalResult = await queryPG(totalQuery, params);
        const total = totalResult.rows?.[0]?.total ?? 0;

        // now append pagination params
        params.push(limit);
        params.push(offset);
        const limitParamIndex = params.length - 1; // index of limit in 1-based $n
        const offsetParamIndex = params.length; // index of offset

        const dataQuery = `
      SELECT *
      FROM blogs
      WHERE ${whereSQL}
      ORDER BY ${sortColumn} ${order}
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
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
