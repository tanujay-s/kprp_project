const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: "Family", required: true },
    name: { type: String, required: true },
    guardianName: { type: String },
    yearType: { type: String, enum: ["birth", "death"], required: true },
    year: { type: Number },
    otherDetails: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Member", memberSchema);