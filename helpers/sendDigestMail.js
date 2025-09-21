import pug from "pug";
import fs from "node:fs";
import path from "node:path";
import resend from "../lib/resend.js";

const templatePath = path.join(process.cwd(), "/views", "weekly-digest.pug");
const compileNewsletter = pug.compile(fs.readFileSync(templatePath, "utf8"), {
    filename: templatePath,
});

// Helper: format date range (last 7 days)
function getDateRange() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const format = (d) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return `${format(start)} – ${format(end)}`;
}

const sendWeeklyDigestMail = async (posts, userEmail, dateRange) => {
    const html = compileNewsletter({
        brandName: "BySiva",
        previewText: "Weekly Digest from Bysiva.blog",
        homepageUrl: "https://www.bysiva.blog/",
        logoUrl: "https://www.bysiva.blog/logo.png",
        primaryColor: "#2563eb",
        accentColor: "#0f172a",
        posts,
        dateRange,
        unsubscribeUrl:
            "https://writes-by-siva-server-production.up.railway.app/unsubscribe?email=" +
            userEmail,
        managePrefsUrl:
            "https://writes-by-siva-server-production.up.railway.app/preferences",
        contactEmail: "sambasivareddychinta@gmail.com",
        addressLines: ["Vijayawada", "India, 520002"],
        social: {
            instagram: "https://www.instagram.com/samsr.ch/",
            linkedin: "https://www.linkedin.com/in/samba-siva-reddy-ch/",
            github: "https://github.com/sambasivareddy-ch",
        },
    });

    try {
        await resend.emails.send({
            from: '"Samba Siva" <news@bysiva.blog>',
            to: userEmail,
            subject: `Weekly Digest (${dateRange})`,
            html,
        });
        return true;
    } catch (err) {
        return false;
    }
};

cron.schedule("30 7 * * 0", async () => {
    console.log("Running weekly digest job...");

    // Get posts from last 7 days
    const blogs = await queryPG(`
      SELECT slug, title, description, author, created_at::date AS date
      FROM blogs
      WHERE created_at >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `);

    if (blogs.rows.length === 0) {
        console.log("No new blogs this week, skipping.");
        return;
    }

    const dateRange = getDateRange();

    const posts = blogs.rows.map(post => ({
        title: post.title,
        url: `https://www.bysiva.blog/blog/${post.slug}`,
        excerpt: post.description,
        author: post.author,
        date: post.date,
    }));

    // Get subscribers
    const subscribers = await queryPG("SELECT * FROM subscribers");

    // Send to all
    for (const user of subscribers.rows) {
        const email = decryptEmail({
            encrypted: user.email_encrypted,
            iv: user.email_iv,
            tag: user.email_tag,
        });

        await sendWeeklyDigestMail(posts, email, dateRange);
    }

    console.log(
        `Weekly digest sent to ${subscribers.rows.length} subscribers.`
    );
});
