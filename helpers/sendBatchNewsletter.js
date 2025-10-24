// sendBatchNewsletterToSubscribers.js
import pug from "pug";
import fs from "node:fs";
import path from "node:path";
import resend from "../lib/resend.js"; // your initialized resend client

/* CONFIG */
const BATCH_SIZE = 100;
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 300;
const BETWEEN_BATCH_DELAY_MS = 500; // safe pacing; optional

/* template compile once (we will call compile with locals per user) */
const templatePath = path.join(process.cwd(), "/views", "newsletter.pug");
const compileNewsletter = pug.compile(fs.readFileSync(templatePath, "utf8"), {
    filename: templatePath,
});

/* helpers */
function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
function backoffDelay(attempt) {
    const cap = 30000;
    const exp = Math.min(cap, BASE_BACKOFF_MS * Math.pow(2, attempt));
    const jitter = Math.floor(
        Math.random() * Math.min(500, Math.floor(exp / 4))
    );
    return exp + jitter;
}
function isTransientError(err) {
    if (!err) return false;
    const status =
        err.statusCode || err.status || (err.response && err.response.status);
    if (status === 429) return true;
    if (err.code) {
        const transient = [
            "ECONNRESET",
            "ETIMEDOUT",
            "EAI_AGAIN",
            "ECONNREFUSED",
        ];
        if (transient.includes(err.code)) return true;
    }
    if (
        err.message &&
        typeof err.message === "string" &&
        err.message.includes("429")
    )
        return true;
    return false;
}

/**
 * Try an async function with exponential backoff on transient errors.
 * fn should be an async function that performs the single batch API call.
 */
async function tryWithRetries(fn, maxRetries = MAX_RETRIES) {
    let attempt = 0;
    while (true) {
        try {
            const res = await fn();
            return res;
        } catch (err) {
            if (!isTransientError(err)) throw err; // permanent, rethrow
            attempt++;
            if (attempt > maxRetries)
                throw new Error(`Retries exhausted: ${err.message || err}`);
            const delay = backoffDelay(attempt);
            console.warn(
                `Transient error, retry #${attempt} after ${delay}ms:`,
                err && (err.message || err)
            );
            await sleep(delay);
        }
    }
}

/**
 * Main: send batch newsletter
 * - subscribers: array of strings (emails) or objects with { email }
 * - post: post object { title, slug, description, date }
 * - options: optional overrides
 */
const sendBatchNewsletterToSubscribers = async (
    subscribers = [],
    post = {},
    options = {}
) => {
    const {
        brandName = "BySiva",
        previewText = "A new post just dropped at BySiva.blog",
        homepageUrl = "https://www.bysiva.blog/",
        logoUrl = "https://www.bysiva.blog/logo.png",
        primaryColor = "#2563eb",
        accentColor = "#0f172a",
        contactEmail = "sambasivareddychinta@gmail.com",
        addressLines = ["Vijayawada", "India, 520002"],
        social = {},
        unsubscribeBase = "https://writes-by-siva-server-production.up.railway.app/unsubscribe",
        managePrefsUrl = "https://writes-by-siva-server-production.up.railway.app/preferences",
        from = '"Samba Siva" <news@bysiva.blog>',
    } = options;

    if (!post || !post.title) {
        throw new Error("post object with title is required");
    }

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
        console.log("No subscribers to send to.");
        return;
    }

    // Normalize subscribers to objects with email
    const normalized = subscribers.map((s) => {
        if (typeof s === "string") return { email: s };
        if (s && s.email) return s;
        throw new Error("subscriber must be string or object with email");
    });

    // Send in batches of BATCH_SIZE
    for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
        const batchSlice = normalized.slice(i, i + BATCH_SIZE);

        // Build payloads (each gets its own html so unsubscribe can be personalized)
        const emailsPayload = batchSlice.map((user) => {
            // personalize unsubscribe URL (you can also include a token if you track user ids)
            const unsubscribeUrl = `${unsubscribeBase}?email=${encodeURIComponent(
                user.email
            )}`;

            // compile html per user so the unsubscribe link and any personal tokens are accurate
            const html = compileNewsletter({
                brandName,
                previewText,
                homepageUrl,
                logoUrl,
                primaryColor,
                accentColor,
                posts: [
                    {
                        title: post.title,
                        url: `https://www.bysiva.blog/blog/${post.slug}`,
                        excerpt: post.description,
                        author: "Siva",
                        date: post.date,
                    },
                ],
                unsubscribeUrl,
                managePrefsUrl,
                contactEmail,
                addressLines,
                social,
            });

            return {
                from,
                to: user.email,
                subject: `New Blog: ${post.title}`,
                html,
            };
        });

        // Single batch API call wrapped with retry/backoff for transient errors
        try {
            const sendFn = async () => {
                // Your resend client: adjust method if your wrapper differs.
                // Many libs provide resend.batch.send(...) or resend.emails.batch(...)
                return await resend.batch.send(emailsPayload);
            };

            const result = await tryWithRetries(sendFn);
            console.log(
                `Batch ${Math.floor(i / BATCH_SIZE) + 1} result:`,
                result && result.status ? result.status : "ok"
            );
        } catch (err) {
            // If batch fails after retries, log the error and optionally persist to DB
            console.error(
                `Failed to send batch starting at index ${i}:`,
                err && (err.message || err)
            );
            // Optional: persist emailsPayload for manual retry later
        }

        // Optional delay to avoid firehose if you do many batches
        if (i + BATCH_SIZE < normalized.length) {
            await sleep(BETWEEN_BATCH_DELAY_MS);
        }
    }

    console.log("All batches processed.");
};

export default sendBatchNewsletterToSubscribers;
