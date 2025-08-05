import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const results = await queryPG('DELETE FROM blog_posts WHERE id = $1', [id]);

        if (results.rowCount === 0) {
            res.status(201).json({
                success: true,
                message: 'No row found'
            })
            return;
        }

        if (results.rowCount === 1) {
            res.status(200).json({
                success: true,
                message: 'Deleted row successfully'
            })
        } else {
            res.status(401).json({
                success: false,
                message: 'Given row id does not exists'
            })
        }

    } catch(err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server",
        })
    }
});

export default router;