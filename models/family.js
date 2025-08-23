const { type } = require("express/lib/response");
const mongoose = require("mongoose");

const familySchema = new mongoose.Schema({
    lineageName: {type: String, required: true},
    clan: {type: String, required: true},
    village: {type: String, required: true},
    nyayPanchayat: {type: String, required: false},
    block: {type: String, required: true},
    oldResidence: {type: String, required: false},
}, { timestamps: true });


familySchema.index({block: 1, nyayPanchayat: 1, village: 1, lineageName: 1});

module.exports = mongoose.model("Family", familySchema);