
import express from 'express';
import { firestore } from '../firestore/collections';
import { getAi, generateContentWithRetry } from '../services/aiService';

const router = express.Router();

async function generateTranslation(name: string, type: string): Promise<string> {
    const prompt = `Translate the ${type} name "${name}" to Arabic. Provide ONLY the Arabic name.`;
    const result = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt
    });
    return result.text?.trim() || name;
}

router.get('/translate', async (req, res) => {
    const { name, type } = req.query;
    if (!name || !type) {
        return res.status(400).json({ error: "Missing name or type" });
    }

    try {
        const collectionName = `${type}s_translations`;
        const docRef = firestore.collection(collectionName).doc((name as string).toLowerCase());
        const docSnap = await docRef.get();

        if (docSnap.exists) {
            return res.json({ arabic: docSnap.data()?.arabic });
        }

        // Generate with retry or fallback
        try {
            const arabic = await generateTranslation(name as string, type as string);
            await docRef.set({ english: name, arabic, type });
            res.json({ arabic });
        } catch (genError) {
            console.error("AI Generation error, returning English name:", genError);
            res.json({ arabic: name });
        }
    } catch (error) {
        console.error("Error in translation route:", error);
        res.json({ arabic: name }); // Fallback on database error
    }
});

export default router;
