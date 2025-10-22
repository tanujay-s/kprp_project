// import mongoose from "mongoose";
const mongoose = require("mongoose");

const nyayPanchayatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Block",
      required: true,
    },
  },
  { timestamps: true }
);

nyayPanchayatSchema.index({ name: 1, blockId: 1 }, { unique: true });

// export default mongoose.model("NyayPanchayat", nyayPanchayatSchema);
module.exports = mongoose.model("NyayPanchayat", nyayPanchayatSchema);
