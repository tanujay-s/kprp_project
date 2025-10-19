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
    let { familyId, name, guardianName, year, yearType, otherDetails } = req.body;

    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }

     if (year && year.trim() !== "") {
      year = new Date(year); 
    } else {
      year = null;
    }

    if (!year) {
      yearType = null;
    } else if (yearType === "" || yearType === undefined) {
      yearType = null;
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
    const { block, village, nyayPanchayat , id } = req.query;

    let query = {};
    if (block) query.block = block;
    if (village) query.village = village;
    if (nyayPanchayat) query.nyayPanchayat = nyayPanchayat;
    if(id) query._id = id;
    
    const families = await Family.find(query).sort({ createdAt: 1 });

    if (!families) {
      return res.status(404).json({ message: "No families found for given search criteria" });
    }

    const familiesWithMembers = await Promise.all(
      families.map(async (family) => {
        const members = await Member.find({ familyId: family._id }).sort({ createdAt: 1 });;
        return {
          ...family.toObject(),
          members: members || []
        };
      })
    );
    res.json(familiesWithMembers);

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.put("/member/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;

    if ("year" in updates) {
      if (!updates.year || updates.year.trim() === "") {
        updates.year = null;
        updates.yearType = null;
      } else {
        updates.year = new Date(updates.year);
      }
    }

    if ((!updates.year || updates.year === null) && updates.yearType) {
      updates.yearType = null;
    }

    Object.keys(updates).forEach(key => {
      if (updates[key] === "" || updates[key] === undefined) {
        delete updates[key];
      }
    });

    const updatedMember = await Member.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({
      message: "Member details updated successfully",
      member: updatedMember
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating member", error: error.message });
  }
});

router.put("/family/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let updates = req.body;

    Object.keys(updates).forEach(key => {
      if (updates[key] === "" || updates[key] === undefined) {
        delete updates[key];
      }
    });

    const updatedFamily = await Family.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedFamily) {
      return res.status(404).json({ message: "Family not found" });
    }

    res.json({
      message: "Family details updated successfully",
      family: updatedFamily
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating family", error: error.message });
  }
});

router.delete("/members/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMember = await Member.findByIdAndDelete(id);

    if (!deletedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.json({
      message: "Member deleted successfully",
      member: deletedMember
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting member", error: error.message });
  }
});

router.delete("/family/:id", async (req, res) => {
    const familyId = req.params.id;

    try {
        const deletedFamily = await Family.findByIdAndDelete(familyId);

        if (!deletedFamily) {
            return res.status(404).json({ message: "Family not found" });
        }

        await Member.deleteMany({ familyId: deletedFamily._id });

        res.status(200).json({ message: "Family deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
