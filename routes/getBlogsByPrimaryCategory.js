import { Router } from "express";

import { queryPG } from "../db/db.js";

const router = Router();

router.post('/:primary', async (req, res) => {
    const { primary } = req.params;
    let { domains } = req.body;

    if (typeof domains === 'string') {
        // Split on commas, trim, and lower-case
        domains = domains
          .split(',')
          .map(d => d.trim().toLowerCase())
          .filter(Boolean);
    }
      

    try {
        const results = await queryPG(`
        WITH src AS (SELECT $2::text[] AS src_domains)
        SELECT
            b.slug,
            b.title,
            b.readtime,
            (b.likes + b.fires + b.laugh + b.anger) AS reactions,
            (
                SELECT count(*)
                FROM unnest(regexp_split_to_array(coalesce(b.domains, ''), '\s*,\s*')) AS d
                WHERE lower(d) = ANY (src.src_domains)
            )::int AS domain_overlap
        FROM blogs b, src
        WHERE b.primary_category = $1
        AND b.visible = true
        ORDER BY reactions DESC, domain_overlap DESC, random()
        LIMIT 10;
        `, [primary, domains]);

        if (results.rowCount === 0) {
            res.status(201).json({
                posts: null,
                success: true
            })
            return;
        }

        res.status(200).json({
            success: true,
            posts: results.rows,
        })

    } catch(err) {
        res.status(500).json({
            success: false,
            message: err,
        })
    }
})

export default router;