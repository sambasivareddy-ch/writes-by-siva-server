import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.post("/:comment_id/like", async (req, res) => {
    const { comment_id } = req.params;

    try {
        const result = await queryPG(
            `
            UPDATE comments
            SET likes = COALESCE(likes, 0) + 1
            WHERE id = $1
            RETURNING id, likes
            `,
            [comment_id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Comment liked successfully",
            data: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Error while liking comment",
            err,
        });
    }
});

export default router;
