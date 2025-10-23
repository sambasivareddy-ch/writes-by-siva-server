import { Router } from "express";
import { queryPG } from "../db/db.js";
import notifyDiscord from "../helpers/notifyDiscord.js";

const router = Router();

router.patch('/:slug', async (req, res) => {
    const { slug } = req.params;
    const { type } = req.body;

    const allowedFields = ['likes', 'views', 'fires'];

    if (!allowedFields.includes(type)) {
        return res.status(400).json({
            success: false,
            message: "Invalid update type"
        });
    }

    try {
        const results = await queryPG(`
            UPDATE blogs SET ${type} = COALESCE(${type}, 0) + 1, updated_at = NOW() WHERE slug = $1 RETURNING * 
        `, [slug]);

        if (results.rowCount === 0) {
            res.status(201).json({
                posts: null,
                success: true
            })
            return;
        }

        // await notifyDiscord(
        //     process.env.DISCORD_WEBHOOK,
        //     `
        //         Someone ${type === 'like'? 'liked': 'viewed'} your blog with title ${results.row[0].title} at ${new Date().toLocaleString()}.
        //         Current likes = ${results.row[0].likes} and views = ${results.row[0].views}
        //     `
        // )

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