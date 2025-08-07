import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router()

router.route('/')
    .get((req, res) => {
        res.render('form', {
            admin: req.session.admin,
        })
    })
    .post(async (req, res) => {
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
                    primary, domains, filename
                ]
            );

            if (results.rowCount === 0) {
                res.status(201).json({
                    posts: null,
                    success: true
                })
                return;
            }

            res.redirect('/post')

        } catch(err) {
            res.status(500).json({
                success: false,
                message: "Error occurred at server",
                err
            })
        }
    })

export default router;