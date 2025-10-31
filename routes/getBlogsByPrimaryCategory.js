import { Router } from "express";

import { queryPG } from "../db/db.js";

const router = Router();

router.get('/:primary', async (req, res) => {
    const { primary } = req.params;

    try {
        const results = await queryPG(`
            SELECT 
                slug, title, readtime, likes + fires + laugh + anger as reactions
            FROM 
                blogs
            WHERE primary_category = $1 and visible = true
            ORDER BY
                likes + fires + laugh + anger
            DESC;
        `, [primary]);

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
            message: "Error occurred at server",
        })
    }
})

export default router;