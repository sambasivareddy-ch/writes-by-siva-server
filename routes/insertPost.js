import { Router } from "express";
import { queryPG } from "../db/db.js";
import notifyDiscord from "../helpers/notifyDiscord.js";

const router = Router();

router.post('/', async (req, res) => {
    const { id, slug, title, description, date, primary, domains, filename } = req.body;

    try {
        const results = await queryPG(
            `
                INSERT INTO blogs (id, slug, title, description, date, primary_category, domains, filename, created_at, updated_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, 
            [
                id, slug, title, description, date,
                primary, domains.toString(), filename, now(), now(), req.session.author
            ]
        );

        if (results.rowCount === 0) {
            res.status(201).json({
                posts: null,
                success: true
            })
            return;
        }

        await notifyDiscord(process.env.DISCORD_WEBHOOK, `New Blog has been posted at ${new Date().toLocaleString()}} with Title: ${title}`)

        res.redirect('/dashboard', {
            admin: req.session.admin,
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