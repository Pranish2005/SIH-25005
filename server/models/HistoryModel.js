import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scores: { type: Object },
  summary: { type: String },
  measurements: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

const HistoryModel = mongoose.model('History', HistorySchema);

export default HistoryModel;
