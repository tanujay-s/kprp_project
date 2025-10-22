// import mongoose from "mongoose";
const mongoose = require("mongoose");

const villageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nyayPanchayatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NyayPanchayat", // connects to its parent Nyay Panchayat
      required: true,
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Block", // also connects to its Block (via Nyay Panchayat)
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate villages under same Nyay Panchayat
villageSchema.index({ name: 1, nyayPanchayatId: 1 }, { unique: true });

// export default mongoose.model("Village", villageSchema);
module.exports = mongoose.model("Village", villageSchema);
