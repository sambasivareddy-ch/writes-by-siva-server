import { Router } from "express";
import { queryPG } from "../db/db.js"

const router = Router();

router.get('/', async (req, res) => {
    try {
        // Monthly aggregates (SUM of columns; SUM ignores NULL but we still fallback when parsing)
        const results = await queryPG(`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') AS month,
                COALESCE(SUM(views), 0) AS total_views,
                COALESCE(SUM(likes), 0) AS total_likes,
                COALESCE(SUM(fires), 0) AS total_fires,
                COALESCE(SUM(laugh), 0) AS total_laughs,
                COALESCE(SUM(anger), 0) AS total_anger
            FROM blogs
            GROUP BY month
            ORDER BY month ASC;
        `);

        // Most reacted: compute total reactions per row with COALESCE and return total_reactions and slug/title
        const mostReacted = await queryPG(`
            SELECT 
                title, slug,
                COALESCE(likes, 0) AS likes,
                COALESCE(fires, 0) AS fires,
                COALESCE(laugh, 0) AS laugh,
                COALESCE(anger, 0) AS anger,
                (COALESCE(likes, 0) + COALESCE(fires, 0) + COALESCE(laugh, 0) + COALESCE(anger, 0)) AS total_reactions
            FROM blogs
            ORDER BY
                (COALESCE(likes, 0) + COALESCE(fires, 0) + COALESCE(laugh, 0) + COALESCE(anger, 0)) DESC
            LIMIT 1;
        `);

        // Most viewed: order by views (use COALESCE to be safe)
        const mostViewed = await queryPG(`
            SELECT 
                title, slug, COALESCE(views, 0) AS views
            FROM blogs
            ORDER BY COALESCE(views, 0) DESC
            LIMIT 1;
        `);

        const stats = (results.rows || []).map(row => ({
            month: row.month,
            total_views: parseInt(row.total_views || 0, 10),
            total_likes: parseInt(row.total_likes || 0, 10),
            total_fires: parseInt(row.total_fires || 0, 10),
            total_laughs: parseInt(row.total_laughs || 0, 10),
            total_anger: parseInt(row.total_anger || 0, 10)
        }));

        // Chart arrays
        const labels = stats.map(r => r.month);
        const views = stats.map(r => r.total_views);

        // element-wise sum of reaction columns to create a 'reactions' array per month
        const reactions = stats.map(r =>
            r.total_likes + r.total_fires + r.total_laughs + r.total_anger
        );

        // optional: arrays for each reaction type if you need stacked charts
        const likes = stats.map(r => r.total_likes);
        const fires = stats.map(r => r.total_fires);
        const laughs = stats.map(r => r.total_laughs);
        const anger = stats.map(r => r.total_anger);

        const top = mostReacted.rows[0] || { title: '', slug: '', likes: 0, fires: 0, laugh: 0, anger: 0, total_reactions: 0 };
        const topViews = mostViewed.rows[0] || { title: '', slug: '', views: 0 };

        res.render('stats', {
            admin: req.session.admin,
            labels: JSON.stringify(labels),
            views: JSON.stringify(views),
            // pass the total reactions per month (element-wise)
            reactions: JSON.stringify(reactions),
            // also pass individual reaction arrays if template/chart wants them
            likes: JSON.stringify(likes),
            fires: JSON.stringify(fires),
            laughs: JSON.stringify(laughs),
            anger: JSON.stringify(anger),
            mostReacted: top,
            mostViewed: topViews
        });

    } catch (err) {
        console.error("Error in /stats route:", err);
        res.status(500).json({
            success: false,
            message: 'Error at server',
            error: err.message || err
        });
    }
});

export default router;
