import express from 'express';
import Scan from '../models/Scan.js';

const router = express.Router();

router.get('/recent-scans', async (req, res) => {
  try {
    const scans = await Scan.find().sort({ date: -1 }).limit(10);
    res.json({ scans });
  } catch (e) {
    res.status(500).json({ msg: 'Error fetching scans', error: e.message });
  }
});

export default router;
