// backend/routes/classifyRoutes.js

import express from 'express';
import multer from 'multer';
import axios from 'axios';

const router = express.Router();
const upload = multer();

router.post('/classify-photo', upload.single('file'), async (req, res) => {
  try {
    // Forward the uploaded image buffer to YOLOv8 FastAPI server
    const response = await axios.post(
      'http://10.197.38.240:8000/classify-photo/', // Change to your actual FastAPI URL & port
      req.file.buffer,
      {
        headers: {
          'Content-Type': req.file.mimetype,
        },
      }
    );

    // Send back AI classification response to mobile app
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding to YOLOv8 inference:', error.message || error);
    res.status(500).json({ msg: 'Inference server error', error: error.message });
  }
});

export default router;
