// backend/routes/classifyRoutes.js

import express from 'express';
import multer from 'multer';
import axios from 'axios';

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

export default router;
