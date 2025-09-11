import { Router } from "express";
import { queryPG } from "../db/db.js";
import { encryptEmail, hashEmail } from "../helpers/cryptEmail.js";

const router = Router();

router.post("/", async (req, res) => {
    const { email } = req.body;

    const hashedEmail = hashEmail(email);
    const encrypted = encryptEmail(email);

    try {
        const emailResult = await queryPG(
            `SELECT COUNT(*) FROM subscribers WHERE email_hash=$1`,
            [hashEmail]
        );
        if (parseInt(emailResult.rows[0].count) === 1) {
            res.status(201).json({
                success: false,
                message: "Email Already Exists",
            });
            return;
        }

        const insertRows = await queryPG(
            `INSERT INTO subscribers(email_encrypted, email_iv, email_tag, email_hash, created_at)
            VALUES($1, $2, $3, $4, $5) RETURNING *`,
            [
                encrypted.encrypted,
                encrypted.iv,
                encrypted.tag,
                hashedEmail,
                new Date(),
            ]
        );

        if (insertRows.rowCount === 1) {
            res.status(200).json({
                success: true,
                message: "Successfully Subscribed",
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            err,
        });
    }
});

export default router;
