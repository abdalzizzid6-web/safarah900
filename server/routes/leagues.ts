
import express from "express";
const router = express.Router();
router.get("/", (req, res) => res.json({ leagues: [] }));
export default router;
