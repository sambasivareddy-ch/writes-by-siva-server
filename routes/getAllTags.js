import { Router } from 'express';
import { queryPG } from '../db/db.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const query = "SELECT domains FROM blogs;"
        const tagsResult = await queryPG(query);

        if (tagsResult.rowCount === 0) {
            res.status(200).json({
                success: true,
                tags: [],
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

        res.status(200).json({
            success: true,
            tags
        })
    } catch(err) {
        res.status(500).json({
            success: false,
            err,
        })
    }
});

export default router;