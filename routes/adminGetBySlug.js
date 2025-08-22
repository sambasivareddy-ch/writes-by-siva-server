import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.get('/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const results = await queryPG('SELECT * FROM blogs WHERE slug = $1', [slug]);

        if (results.rowCount === 0) {
            res.status(201).json({
                posts: null,
                success: true
            })
            return;
        }

        return res.render('edit-form', {
            admin: req.session.admin,
            post: results.rows[0],
        })

    } catch(err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server",
        })
    }
})

export default router;