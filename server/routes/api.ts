import express from 'express';
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'global' }));
router.get('/rss/health', (req, res) => res.json({ status: 'ok', service: 'rss' }));
router.get('/matches/health', (req, res) => res.json({ status: 'ok', service: 'matches' }));
router.get('/ai/health', (req, res) => res.json({ status: 'ok', service: 'ai' }));
router.get('/seo/health', (req, res) => res.json({ status: 'ok', service: 'seo' }));

export default router;
