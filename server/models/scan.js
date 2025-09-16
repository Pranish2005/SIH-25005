import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
  {
    animalId: { type: String, required: true },
    breed: { type: String, required: true },
    date: { type: Date, required: true },
    imageUrl: { type: String }, // Optional field to store animal photo URL
  },
  { timestamps: true }
);

const Scan = mongoose.model("Scan", scanSchema);
export default Scan;
