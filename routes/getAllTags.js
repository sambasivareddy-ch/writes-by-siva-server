import { Router } from 'express';
import { queryPG } from '../db/db.js';

const router = Router();

router.get('/', async (req, res) => {
    try {
        const query = "SELECT domains FROM blogs;"
        const tagsResult = await queryPG(query);

        const rows = tagsResult.rows;

        const domains = rows
                .flatMap(row => row.domain.split(","))
                .map(d => d.trim().toLowerCase())
                .filter(d => d.length > 0);

        // Get unique values
        const uniqueDomains = [...new Set(domains)];

        res.json({ domains: uniqueDomains });
    } catch(err) {
        res.status(500).json({
            success: false,
            err,
        })
    }
});

export default router;