import { Router } from "express";

import { queryPG } from "../db/db.js";

const router = Router();

router.delete('/', async (req, res) => {
    const { email } = req.query;

    if (!email.trim()) {
        res.status(402).json({
            success: false,
            message: 'Please give valid email address',
        })
    }

    try {
        const results = await queryPG('DELETE FROM newsletter WHERE email = $1', [email]);

        if (results.rowCount === 0) {
            res.status(201).json({
                success: true,
                message: 'No row found'
            })
            return;
        }

        if (results.rowCount === 1) {
            res.status(200).json({
                success: true,
                message: 'Successfully Unsubscribed'
            })
        } else {
            res.status(401).json({
                success: false,
                message: 'Email does not exists'
            })
        }

    } catch(err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server",
        })
    }
})

export default router;