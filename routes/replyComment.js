import { Router } from "express";
import { queryPG } from "../db/db.js";
import notifyDiscord from "../helpers/notifyDiscord.js";

const router = Router();

router.post("/:comment_id/reply", async (req, res) => {
    const { comment_id } = req.params;
    const { username, comment, blog_slug_id, uuid } = req.body;

    try {
        // Insert reply
        const result = await queryPG(
            `
            INSERT INTO comments (post_id, comment, username, parent_comment_id, created_at, uuid)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [blog_slug_id, comment, username, comment_id, new Date(), uuid]
        );

        if (result.rowCount === 0) {
            return res.status(500).json({
                success: false,
                message: "Error while posting reply",
            });
        }

        // Optional: notify Discord
        const blogResult = await queryPG(
            "SELECT title FROM blogs WHERE slug = $1",
            [blog_slug_id]
        );
        if (blogResult.rowCount > 0) {
            await notifyDiscord(
                process.env.DISCORD_WEBHOOK,
                `💬 New reply added at ${new Date().toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                })} to blog: ${blogResult.rows[0].title}`
            );
        }

        res.status(200).json({
            success: true,
            message: "Reply added successfully",
            data: result.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Error while replying to comment",
            err,
        });
    }
});

export default router;
