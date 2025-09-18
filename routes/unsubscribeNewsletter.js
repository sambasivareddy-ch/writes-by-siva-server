import { Router } from "express";

import { queryPG } from "../db/db.js";
import { hashEmail } from "../helpers/cryptEmail.js";
import sendUnSubscribedMail from "../helpers/sendUnsubscribedMail.js";

const router = Router();

router.get('/', async (req, res) => {
    const { email } = req.query;

    const emailHash = hashEmail(email);

    if (!email.trim()) {
        res.status(402).json({
            success: false,
            message: 'Please give valid email address',
        })
    }

    try {
        const results = await queryPG('DELETE FROM subscribers WHERE email_hash = $1', [emailHash]);

        if (results.rowCount === 0) {
            res.status(201).json({
                success: true,
                message: 'No row found'
            })
            return;
        }

        if (results.rowCount === 1) {
            try {
                await sendUnSubscribedMail(email);
            } catch (mailErr) {
                console.error(`❌ Failed to un-subscribe email ${email}`, mailErr);
            }

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