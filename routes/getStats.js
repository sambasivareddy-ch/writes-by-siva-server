import { Router } from "express";
import { queryPG } from "../db/db.js"

const router = Router();

router.get('/', async (req, res) => {
    try {
        const results = await queryPG(`
            SELECT 
                TO_CHAR(date, 'YYYY-MM') AS month,
                SUM(views) AS total_views,
                SUM(likes) AS total_likes
            FROM blogs
            GROUP BY month
            ORDER BY month ASC;
        `);

        const mostLiked = await queryPG(`
            SELECT 
                title, slug, likes
            FROM blogs
            ORDER BY likes DESC
            LIMIT 1;
        `);

        const mostViewed = await queryPG(`
            SELECT 
                title, slug, views
            FROM blogs
            ORDER BY views DESC
            LIMIT 1;
        `);

        const stats = results.rows || [];
        const labels = stats.map(row => row.month);
        const views = stats.map(row => parseInt(row.total_views));
        const likes = stats.map(row => parseInt(row.total_likes));

        const top = mostLiked.rows[0] || { title: '', slug: '', likes: 0 };
        const topViews = mostViewed.rows[0] || { title: '', slug: '', views: 0};

        res.render('stats', {
            admin: req.session.admin,
            labels: JSON.stringify(labels),
            views: JSON.stringify(views),
            likes: JSON.stringify(likes),
            mostliked: top,
            mostviewed: topViews
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