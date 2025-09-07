const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
    familyId: { type: mongoose.Schema.Types.ObjectId, ref: "Family", required: true },
    name: { type: String, required: true },
    guardianName: { type: String },
    yearType: { type: String, enum: ["birth", "death"], default: null, required: false },
    year: { type: Date },
    otherDetails: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Member", memberSchema);