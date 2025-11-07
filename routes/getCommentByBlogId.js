import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.get("/:blog_slug_id", async (req, res) => {
    const { blog_slug_id } = req.params;

    try {
        // Fetch all comments for this blog
        const result = await queryPG(
            `
            SELECT 
                c.id AS comment_id,
                c.comment AS message,
                c.username,
                c.likes,
                c.created_at,
                c.parent_comment_id,
                c.uuid
            FROM comments c
            WHERE c.post_id = $1
            ORDER BY c.created_at ASC
            `,
            [blog_slug_id]
        );

        const comments = result.rows;

        console.log(blog_slug_id);

        if (comments.length === 0) {
            return res.status(200).json(comments);
        }

        // Helper to build a map for quick lookup
        const commentMap = {};
        comments.forEach((comment) => {
            comment.thread = []; // add thread key
            comment.created_at = new Date(comment.created_at)
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "/"); // format: YYYY/MM/DD
            commentMap[comment.comment_id] = comment;
        });

        // Build the nested structure
        const nestedComments = [];
        comments.forEach((comment) => {
            if (comment.parent_comment_id) {
                // Find parent and push into its thread
                const parent = commentMap[comment.parent_comment_id];
                if (parent) {
                    parent.thread.push(comment);
                }
            } else {
                // Top-level comment
                nestedComments.push(comment);
            }
        });

        res.status(200).json(nestedComments);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Error fetching comments",
            err,
        });
    }
});

export default router;
