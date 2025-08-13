import { Router } from "express";

import { queryPG } from "../db/db.js";

const router = Router();

router.post('/', async (req, res) => {
    const { email } = req.body;

    try {
        const emailResult = await queryPG(`SELECT COUNT(*) FROM newsletter WHERE email=$1`, [email]);
        if (parseInt(emailResult.rows[0].count) === 1) {
            res.status(201).json({
                success: false,
                message: 'Email Already Exists'
            })
            return;
        }

        const insertRows = await queryPG(
            `INSERT INTO newsletter(email) VALUES($1) RETURNING *`, 
            [email]
        );

        if (insertRows.rowCount === 1) {
            res.status(200).json({
                success: true,
                message: 'Successfully Subscribed',
            })
        }
    } catch(err) {
        res.status(500).json({
            success: false,
            err
        })
    }
})

export default router;