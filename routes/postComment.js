import { Router } from "express";
import { queryPG } from "../db/db.js";
import notifyDiscord from "../helpers/notifyDiscord.js";

const router = Router();

router.post("/", async (req, res) => {
    const { username, comment, parent_comment_id, blog_slug_id, uuid } =
        req.body;

    try {
        const results = await queryPG(
            `
                INSERT INTO comments (post_id, comment, username, parent_comment_id, created_at, uuid) 
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
                `,
            [
                blog_slug_id,
                comment,
                username,
                parent_comment_id /* Expects -1 if it is top-level comment */,
                new Date(),
                uuid,
            ]
        );

        if (results.rowCount === 0) {
            return res.status(501).json({
                message: "Error occurred while posting comment",
                success: false,
            });
        }

        const blogResult = await queryPG(
            "SELECT * FROM blogs WHERE slug = $1",
            [blog_slug_id]
        );

        if (blogResult.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Blog not found",
            });
        }

        await notifyDiscord(
            process.env.DISCORD_WEBHOOK,
            `💬 New Comment has been posted at ${new Date().toLocaleString(
                "en-IN",
                {
                    timeZone: "Asia/Kolkata",
                }
            )} to the blog with Title: ${blogResult.rows[0].title}`
        );

        res.status(200).json({
            success: true,
            message: "Comment Added successfully",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server",
            err,
        });
    }
});

export default router;
