import { Router } from "express";
import { queryPG } from "../db/db.js";
import notifyDiscord from "../helpers/notifyDiscord.js";

const router = Router();

router.post('/', async (req, res) => {
    const { slug, title, description, date, primary, domains, filename, author, visible } = req.body;

    // Convert date safely
    const safeDate = date && date.trim() !== "" ? date : null;

    try {
        const results = await queryPG(
            `
            UPDATE blogs
            SET 
                title = $1,
                description = $2,
                date = $3,
                primary_category = $4,
                domains = $5,
                filename = $6,
                created_at = $7,
                updated_at = $8,
                author = $9,
                visible = $10
            WHERE slug = $11
            RETURNING *;
            `, 
            [
                title, description, safeDate,
                primary, domains?.toString() || null, filename, new Date(), new Date(), author, visible, slug
            ]
        );

        if (results.rowCount === 0) {
            return res.status(201).json({
                posts: null,
                success: true
            });
        }

        await notifyDiscord(
            process.env.DISCORD_WEBHOOK, 
            `Updated the Blog at ${new Date().toLocaleString()} with Title: ${title}`
        );

        // In dashboard route
        router.redirect('/dashboard');
    } catch(err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server",
            err
        });
    }
});


export default router;