import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.get('/', async (req, res) => {
    let blogs = [];
    try {
        const results = await queryPG('SELECT * FROM blogs ORDER BY date DESC', []);
        blogs = results.rows;
        return res.render('dashboard', {
            admin: req.session.admin,
            blogs,
            length: blogs.length
        });
    } catch(err) {
        return res.json({
            success: false,
            err
        })
    }
})

export default router;