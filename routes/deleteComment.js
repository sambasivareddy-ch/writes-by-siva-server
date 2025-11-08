import { Router } from 'express';
import { queryPG } from '../db/db.js';

const router = Router();

router.delete('/:comment_id', async (req, res) => {
    const { comment_id } = req.params;

    try {
        // Recursive query to find all children of the given comment
        const deleteQuery = `
            WITH RECURSIVE comment_tree AS (
                SELECT id
                FROM comments
                WHERE id = $1
                UNION ALL
                SELECT c.id
                FROM comments c
                INNER JOIN comment_tree ct ON c.parent_comment_id = ct.id
            )
            DELETE FROM comments
            WHERE id IN (SELECT id FROM comment_tree);
        `;

        const result = await queryPG(deleteQuery, [comment_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'No comment found with the given ID',
            });
        }

        res.status(200).json({
            success: true,
            message: `Deleted comment and all its child comments successfully (deleted ${result.rowCount} comments).`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Unable to delete the comment',
        });
    }
});

export default router;
