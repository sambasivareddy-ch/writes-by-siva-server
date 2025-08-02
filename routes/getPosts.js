import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.get('/', async (req, res) => {
    try {
        const results = await queryPG('SELECT * FROM blogs ORDER BY date DESC');

        if (results.rowCount === 0) {
            res.status(201).json({
                success: true,
                blogs: null,
                message: "No blogs yet"
            })
            return;
        }

        res.status(200).json({
            success: true,
            blogs: results.rows,
        })

    } catch(err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server",
        })
    }
})

export default router;