import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.get('/', async (req, res) => {
    let blogs = [];
    try {
        const results = await queryPG('SELECT * FROM blogs ORDER BY date', []);
        blogs = results.rows;
    } catch(err) {
        res.json({
            success: false,
            err
        })
    }
    res.render('dashboard', {
        admin: req.session.admin,
        blogs,
        length: blogs.length
    });
})

export default router;