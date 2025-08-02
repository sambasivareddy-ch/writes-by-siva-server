import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.patch('/:slug', async (req, res) => {
    const { slug } = req.params;
    const { type } = req.body;

    const allowedFields = ['likes', 'views'];

    if (!allowedFields.includes(type)) {
        return res.status(400).json({
            success: false,
            message: "Invalid update type"
        });
    }

    try {
        const results = await queryPG(`
            UPDATE blogposts SET ${type} = ${type} + 1, updated_at = NOW() WHERE slug = $1 RETURNING * 
        `, [slug]);

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
            err
        })
    }
})

export default router;