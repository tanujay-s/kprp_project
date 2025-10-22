// import mongoose from "mongoose";
const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// export default mongoose.model("Block", blockSchema);
module.exports = mongoose.model("Block", blockSchema);
