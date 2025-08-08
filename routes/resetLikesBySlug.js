import { Router } from "express";
import { queryPG } from "../db/db.js";

const router = Router();

router.patch('/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        await queryPG('UPDATE blogs SET likes = 0 WHERE slug = $1', [slug]);

        res.status(200).json({
            success: true,
            message: "Successfully resetted the likes"
        })

    } catch(err) {
        res.status(500).json({
            success: false,
            message: "Error occurred at server",
        })
    }
})

export default router;