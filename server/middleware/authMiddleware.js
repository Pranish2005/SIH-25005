// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // You should have user id in jwt payload as `id`
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
