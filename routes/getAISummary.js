import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.get('/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Summarize https://www.bysiva.blog/${slug} in 200 words`
        })

        res.status(201).json({
            success: true,
            text: response.text
        })
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error in accessing the Gemini AI',
            err
        })
    }
})

export default router;