import express from 'express';
import multer from 'multer';
import axios from 'axios';
import authMiddleware from '../middleware/authMiddleware.js';
import HistoryModel from '../models/HistoryModel.js';



const router = express.Router();
const upload = multer();

router.post('/classify-photo', upload.single('file'), async (req, res) => {
  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

    const response = await axios.post(
      'http://10.197.38.240:8000/classify-photo/',
      formData,
      { headers: formData.getHeaders() }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding to YOLOv8 inference:', error.message || error);
    res.status(500).json({ msg: 'Inference server error', error: error.message });
  }
});

// Assuming JWT auth and user info available in req.user (adjust as per your backend)
router.post('/history/save', authMiddleware,  async (req, res) => {
  try {
    const userId = req.user.id; // Extract from auth middleware/session
    const { summary, scores, measurements } = req.body;

    // Save to DB here - example using MongoDB
    const historyItem = new HistoryModel({
      userId,
      summary,
      scores,
      measurements,
      createdAt: new Date(),
    });

    await historyItem.save();

    res.json({ success: true, message: 'History saved' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error saving history' });
  }
});

router.get('/history/recent', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch last 5 history for this user sorted by createdAt descending
    const recent = await HistoryModel.find({ userId }).sort({ createdAt: -1 }).limit(5);

    res.json({ history: recent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error fetching history' });
  }
});


export default router;
