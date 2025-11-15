import { Router } from 'express';
import { queryPG } from '../db/db.js';

const router = Router();

router.get('/', async (req, res) => {
    const { primary = 'all' } = req.query;

    try {
        const whereParts = ["visible = true"];
        const params = [];

        if (primary !== 'all') {
            params.push(`${primary}`);
            whereParts.push(`primary_category = $${params.length}`)
        }

        const whereSQL = whereParts.join(" AND ");

        const query = `SELECT domains FROM blogs WHERE ${whereSQL}`;

        const tagsResult = await queryPG(query, params);

        if (tagsResult.rowCount === 0) {
            res.status(200).json({
                success: true,
                tags: [],
                eachTagCount: {}
            })
            return;
        }

        const rows = tagsResult.rows;
        const tags = Array.from(
            new Set(
                rows.flatMap((row) =>
                    row.domains.split(",")
                )
            )
        );

        const eachTagCount = {};
        tags.forEach((tag) => {
            eachTagCount[tag] = rows.filter(
                (row) => row.domains.split(",").includes(tag)
            ).length;
        })

        res.status(200).json({
            success: true,
            tags,
            eachTagCount
        })
    } catch(err) {
        res.status(500).json({
            success: false,
            err,
        })
    }
});

export default router;