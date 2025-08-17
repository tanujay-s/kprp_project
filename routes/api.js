const express = require("express");
const router = express.Router();
const Family = require("../models/family");
const Member = require("../models/member");

router.post("/family/add", async (req, res) => {
  try {
    const {
      lineageName,
      clan,
      village,
      nyayPanchayat,
      block,
      oldResidence,
      headMember, // optional
    } = req.body;
    
    const newFamily = new Family({
      lineageName,
      clan,
      village,
      nyayPanchayat,
      block,
      oldResidence,
    });

    const savedFamily = await newFamily.save();

    if (headMember && headMember.name) {
      const newMember = new Member({
        ...headMember,
        familyId: savedFamily._id,
      });
      await newMember.save();
    }

    res.status(201).json({ message: "Family added successfully", family: savedFamily });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


router.post("/member/add", async (req, res) => {
  try {
    const { familyId, name, guardianName, year, yearType, otherDetails } = req.body;

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

    const newMember = new Member({
      familyId,
      name,
      guardianName,
      year,
      yearType,
      otherDetails,
    });

    const savedMember = await newMember.save();
    res.status(201).json({ message: "Member added successfully", member: savedMember });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});


router.get("/family/search", async (req, res) => {
  try {
    const { block, village, nyayPanchayat } = req.query;

    let query = {};
    // if (lineageName) query.lineageName = new RegExp(lineageName, "i");
    if (block) query.block = block;
    if (village) query.village = village;
    if (nyayPanchayat) query.nyayPanchayat = nyayPanchayat;

    const families = await Family.find(query);
    res.json(families);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get("/family/:id/members", async (req, res) => {
  try {
    const { id } = req.params;

    const members = await Member.find({ familyId: id });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;
