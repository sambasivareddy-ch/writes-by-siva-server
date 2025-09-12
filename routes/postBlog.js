import { Router } from "express";
import { queryPG } from "../db/db.js";
import sendNewletterToTheSubscriber from "../helpers/sendNewsletter.js";
import notifyDiscord from "../helpers/notifyDiscord.js";
import { decryptEmail } from "../helpers/cryptEmail.js";

const router = Router()

router.route('/')
    .get((req, res) => {
        res.render('form', {
            admin: req.session.admin,
        })
    })
    .post(async (req, res) => {
        const { id, slug, title, description, date, primary, domains, filename, author, visible } = req.body;

        try {
            const results = await queryPG(
                `
                    INSERT INTO blogs (id, slug, title, description, date, primary_category, domains, filename, created_at, updated_at, author, visible) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `, 
                [
                    id, slug, title, description, date,
                    primary, domains, filename, new Date(), new Date(), author, visible
                ]
            );

            if (results.rowCount === 0) {
                res.status(201).json({
                    posts: null,
                    success: true
                })
                return;
            }

            await notifyDiscord(process.env.DISCORD_WEBHOOK, `New Blog has been posted at ${new Date().toLocaleString()}} with Title: ${title}`)

            res.redirect('/post');

            // Fire-and-forget newsletter sending
            // For now sending newsletter when the blogs are not personal
            if (!domains.contains('personal')) {
                (async () => {
                    try {
                        const subscribers = await queryPG(`SELECT * FROM subscribers`);
                        const sendResults = await Promise.allSettled(
                            subscribers.rows.map(user => {
                                const decryptedEmail = decryptEmail({
                                    encrypted: user.email_encrypted,
                                    iv: user.email_iv,
                                    tag: user.email_tag,
                                });
    
                                sendNewletterToTheSubscriber(results.rows[0], decryptedEmail)
                            })
                        );
    
                        sendResults.forEach((result, idx) => {
                            if (result.status === 'rejected') {
                                console.error(`Failed to send to ${subscribers.rows[idx].email}`, result.reason);
                            }
                        });
                    } catch (err) {
                        console.error("Newsletter sending failed", err);
                    }
                })();
            }


        } catch(err) {
            res.status(500).json({
                success: false,
                message: "Error occurred at server",
                err
            })
        }
    })

export default router;