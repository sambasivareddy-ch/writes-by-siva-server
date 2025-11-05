import { Router } from "express";
import { queryPG } from "../db/db.js";
import sendBatchNewsletterToSubscirbers from "../helpers/sendBatchNewsletter.js";
import notifyDiscord from "../helpers/notifyDiscord.js";
import { decryptEmail } from "../helpers/cryptEmail.js";

const router = Router();

router
    .route("/")
    .get((req, res) => {
        res.render("form", {
            admin: req.session.admin,
        });
    })
    .post(async (req, res) => {
        const {
            id,
            slug,
            title,
            description,
            date,
            primary,
            domains,
            filename,
            author,
            visible,
            sendnl
        } = req.body;

        try {
            const results = await queryPG(
                `
                    INSERT INTO blogs (id, slug, title, description, date, primary_category, domains, filename, created_at, updated_at, author, visible) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                    RETURNING *
                `,
                [
                    id,
                    slug,
                    title,
                    description,
                    date,
                    primary,
                    domains,
                    filename,
                    new Date(),
                    new Date(),
                    author,
                    visible,
                ]
            );

            if (results.rowCount === 0) {
                res.status(201).json({
                    posts: null,
                    success: true,
                });
                return;
            }

            if (sendnl.toUpperCase() === 'TRUE') {
                try {
                    const subscribers = await queryPG(`SELECT * FROM subscribers`);
                    const newsletterData = results.rows[0]; // make sure results is defined above
                    
                    const subscribedSubs = [];
                    for (const user of subscribers.rows) {
                        try {
                            const decryptedEmail = decryptEmail({
                                encrypted: user.email_encrypted,
                                iv: user.email_iv,
                                tag: user.email_tag,
                            });
    
                            if (
                                user["subscribed_for"].toLowerCase() === "all" ||
                                user["subscribed_for"].toLowerCase() ===
                                    primary.toLowerCase() ||
                                primary
                                    .toLowerCase()
                                    .includes(user["subscribed_for"].toLowerCase())
                            ) {
                                subscribedSubs.push(decryptedEmail)
                            }
                        } catch (err) {
                            console.error();
                        }
                    }
    
                    await sendBatchNewsletterToSubscirbers(subscribedSubs, newsletterData)
    
                    console.log("Finished sending newsletter to all subscribers.");
                } catch (err) {
                    console.error("Newsletter sending failed", err);
                }
            }

            await notifyDiscord(
                process.env.DISCORD_WEBHOOK,
                `New Blog has been posted at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}} with Title: ${title}`
            );

            res.redirect("/post");
        } catch (err) {
            res.status(500).json({
                success: false,
                message: "Error occurred at server",
                err,
            });
        }
    });

export default router;
