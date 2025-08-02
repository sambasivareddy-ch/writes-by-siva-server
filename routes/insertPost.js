import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.post('/', async (req, res) => {
    const { id, slug, title, description, date, primary, domains, filename } = req.body;

    try {
        const results = await queryPG(
            `
                INSERT INTO blogs (id, slug, title, description, date, primary_category, domains, filename) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, 
            [
                id, slug, title, description, date,
                primary, domains.toString(), filename
            ]
        );

        if (results.rowCount === 0) {
            res.status(201).json({
                posts: null,
                success: true
            })
            return;
        }

        res.status(200).json({
            success: true,
            posts: results.rows,
        })

    } catch(err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server"
        })
    }
})

export default router;