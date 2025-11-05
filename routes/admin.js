const express = require('express');
const router = express.Router();
require ('dotenv').config();
const Family = require('../models/family');
const Member = require('../models/member');
const multer = require('multer');
const XLSX = require('xlsx');
const Block = require('../models/block');
const NyayPanchayat = require('../models/nyayPanchayat');
const Village = require('../models/village');

const storage = multer.memoryStorage();//store uploaded file in the memory
const upload = multer({storage});// actual middleware that handles file upload

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  res.redirect("/admin/login");
}

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Could not log out. Please try again.");
    }
    res.clearCookie("connect.sid"); 
    res.redirect("/admin/login");
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin-login", { error: "गलत यूज़रनेम या पासवर्ड", activePage: "adminLogin" });
  }
});

router.get('/login', (req, res) => {
  res.render('admin-login',  { activePage: "adminLogin" });
});

router.get('/add-family', requireAdmin, (req, res) => {
  res.render('addFamily', { activePage: "" });
});

router.get('/add-location', requireAdmin, (req, res) => {
  res.render('adminLocation', { activePage: "" });
});

// router.get("/dashboard", requireAdmin, async (req, res) => {
//   try {
//     const families = await Family.find().sort({ createdAt: 1 });
//     res.render("dashboard", { families, activePage: "dashboard" }); 
//   } catch (err) {
//     console.error("Error fetching families:", err);
//     res.status(500).send("Error loading families");
//   }
// });
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [families, totalFamilies] = await Promise.all([
      Family.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Family.countDocuments()
    ]);

    const totalPages = Math.ceil(totalFamilies / limit);

    res.render("dashboard", {
      families,
      currentPage: page,
      totalPages,
      totalFamilies,
      limit, // 👈 add this line
      activePage: "dashboard"
    });
  } catch (err) {
    console.error("Error fetching families:", err);
    res.status(500).send("Error loading families");
  }
});

router.get("/family/search", async (req, res) => {
  try {
    const { block, village, nyayPanchayat } = req.query;

    let query = {};
    if (block) query.block = block;
    if (village) query.village = village;
    if (nyayPanchayat) query.nyayPanchayat = nyayPanchayat;
    const families = await Family.find(query).sort({ createdAt: 1 });
    res.json(families);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/search-family", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);

    const safeQ = escapeRegex(q);

    const families = await Family.find({
      $or: [
        { lineageName: { $regex: safeQ, $options: "i" } },
        { village: { $regex: safeQ, $options: "i" } }
      ]
    }).limit(10);

    res.json(families);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/members", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.status(404).send("Family not found");
    }
    const members = await Member.find({ familyId: id });
    res.render("family-member", {activePage: "", family, members });
    // res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.delete("/cleanup", async (req, res) => {
  try {
    console.log(`
    --------------------------------------
    '              Cleaning              '
    '                UP                  '
    '             Database               '
    --------------------------------------  
    `);
    await Family.deleteMany({});
    await Member.deleteMany({});
    res.json({ message: "All families and members deleted" });
  } catch (err) {
    res.status(500).json({ error: err?.message || err });
  }
});

router.post("/upload-family", upload.single("file"), async (req, res) => {

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded!" });
  }

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (data.length === 0) {
    return res.status(400).json({ message: "Empty Excel sheet" });
  }

  const familyInfo = data[0];

  const newFamily = new Family({
    lineageName: familyInfo.Clan ? familyInfo.Clan.trim() : '',
    clan: familyInfo.Kshatriya ? familyInfo.Kshatriya.trim() : '',
    village: familyInfo.Village ? familyInfo.Village.trim() : '',
    nyayPanchayat: familyInfo.Panchayat ? familyInfo.Panchayat.trim() : '',
    block: familyInfo.Block ? familyInfo.Block.trim() : '',
    oldResidence: familyInfo.Old_resident ? familyInfo.Old_resident.trim() : '',
  });

  console.log("family saved: ", newFamily);
  const savedFamily = await newFamily.save();
  if (savedFamily._id) {
    for (const row of data) {

      const name = row.Name && row.Name.trim() !== "" ? row.Name.trim() : null;
      const guardianName = row.Father && row.Father.trim() !== "" ? row.Father.trim() : null;
      const otherDetails = row.Other && row.Other.trim() !== "" ? row.Other.trim() : null;

      let year = row.Year;
      let yearType = row.Year_type ? row.Year_type.toString().trim().toLowerCase() : null;

      if (year) {
        if (typeof year === "number") {
          // Excel numeric date → convert to YYYY-MM-DD without timezone shift
          const parsed = XLSX.SSF.parse_date_code(year);
          if (parsed) {
            year = `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
          } else {
            year = null;
          }
        } else if (/^\d{4}$/.test(year.toString())) {
          // Only 4-digit year
          year = year.toString();
        } else if (typeof year === "string" && year.includes("/")) {
          // String like "16/08/2004"
          const [day, month, yr] = year.split("/");
          if (day && month && yr) {
            year = `${yr}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
          } else {
            year = null;
          }
        } else if (!isNaN(Date.parse(year))) {
          // ISO date string "2004-08-16"
          const d = new Date(year);
          year = d.toISOString().split("T")[0];
        } else {
          year = null;
        }
      } else {
        year = null;
      }

      // Validate yearType
      if (!year) {
        yearType = null;
      } else if (yearType !== "birth" && yearType !== "death") {
        yearType = null;
      }

      const newMember = new Member({
        familyId: savedFamily._id,
        name,
        guardianName,
        year,
        yearType,
        otherDetails,
      });
      console.log(newMember);

      try {
        const savedMember = await newMember.save();
        console.log(`✅ Member "${savedMember.name}" saved successfully`);
      } catch (err) {
        console.error(`❌ Failed to save member "${name || "Unknown"}":`, err.message);
      }
    }
    console.log(`
      .......................................
      .                                     . 
      .            UPDATE COMPLETE          .
      .                                     .
      .......................................
    `)
    res.status(200).json({ message: "Api work complete" });
  } else {
    res.status(400).json({ message: "Failed to add family" });
  }


});

//add a new block
router.post("/block", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Block name is required" });
    }

    // Check duplicate
    const existing = await Block.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({ error: "Block already exists" });
    }

    const block = new Block({ name: name.trim() });
    await block.save();

    res.status(201).json({ message: "Block added successfully", block });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//add new nyay panchayat
router.post("/nyaypanchayat", async (req, res) => {
  try {
    const { name, blockId } = req.body;

    if (!name || !blockId) {
      return res.status(400).json({ error: "Nyay Panchayat name and Block ID are required" });
    }

    // Validate block
    const block = await Block.findById(blockId);
    if (!block) {
      return res.status(404).json({ error: "Block not found" });
    }

    // Check duplicate
    const existing = await NyayPanchayat.findOne({ name: name.trim(), blockId });
    if (existing) {
      return res.status(400).json({ error: "Nyay Panchayat already exists in this Block" });
    }

    const nyay = new NyayPanchayat({ name: name.trim(), blockId });
    await nyay.save();

    res.status(201).json({ message: "Nyay Panchayat added successfully", nyay });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//add new village
router.post("/village", async (req, res) => {
  try {
    const { name, nyayPanchayatId } = req.body;

    if (!name || !nyayPanchayatId) {
      return res.status(400).json({ error: "Village name and Nyay Panchayat ID are required" });
    }

    // Validate Nyay Panchayat
    const nyay = await NyayPanchayat.findById(nyayPanchayatId);
    if (!nyay) {
      return res.status(404).json({ error: "Nyay Panchayat not found" });
    }

    // Get associated block
    const blockId = nyay.blockId;

    // Check duplicate
    const existing = await Village.findOne({ name: name.trim(), nyayPanchayatId });
    if (existing) {
      return res.status(400).json({ error: "Village already exists under this Nyay Panchayat" });
    }

    const village = new Village({
      name: name.trim(),
      nyayPanchayatId,
      blockId,
    });
    await village.save();

    res.status(201).json({ message: "Village added successfully", village });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all Blocks
router.get("/blocks", async (req, res) => {
  try {
    const blocks = await Block.find().sort({ name: 1 }); // sorted alphabetically
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all Nyay Panchayats
// Optional query param: ?blockId=123
router.get("/nyaypanchayats", async (req, res) => {
  try {
    const { blockId } = req.query;
    const filter = blockId ? { blockId } : {};

    const nyayPanchayats = await NyayPanchayat.find(filter)
      .populate("blockId", "name")
      .sort({ name: 1 });

    res.json(nyayPanchayats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all Villages
// Optional query params: ?blockId=123 OR ?nyayPanchayatId=456
router.get("/villages", async (req, res) => {
  try {
    const { blockId, nyayPanchayatId } = req.query;
    const filter = {};

    if (blockId) filter.blockId = blockId;
    if (nyayPanchayatId) filter.nyayPanchayatId = nyayPanchayatId;

    const villages = await Village.find(filter)
      .populate("nyayPanchayatId", "name")
      .populate("blockId", "name")
      .sort({ name: 1 });

    res.json(villages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.get("/hierarchy", async (req, res) => {
//   try {
//     const blocks = await Block.find().lean();

//     // Get all nyay panchayats with block reference populated
//     const nyayPanchayats = await NyayPanchayat.find()
//       .populate("block", "name") // only include block name
//       .lean();

//     // Get all villages with nyayPanchayat and block populated
//     const villages = await Village.find()
//       .populate("block", "name")
//       .populate("nyayPanchayat", "name")
//       .lean();

//     res.json({ blocks, nyayPanchayats, villages });
//   } catch (err) {
//     console.error("Error fetching hierarchy:", err);
//     res.status(500).json({ error: "Failed to fetch hierarchy data" });
//   }
// });
// GET /admin/hierarchy
router.get("/hierarchy", async (req, res) => {
  try {
    // 1️⃣ Fetch all blocks
    const blocks = await Block.find().lean();

    // 2️⃣ Fetch all nyay panchayats and populate block name
    const nyayPanchayats = await NyayPanchayat.find()
      .populate("blockId", "name") // populate block name
      .lean();

    // 3️⃣ Fetch all villages and populate block & nyay panchayat names
    const villages = await Village.find()
      .populate("blockId", "name")
      .populate("nyayPanchayatId", "name")
      .lean();

    // 4️⃣ Return structured response
    res.json({
      blocks,
      nyayPanchayats,
      villages,
    });
  } catch (err) {
    console.error("Error fetching hierarchy:", err);
    res.status(500).json({ error: "Failed to fetch hierarchy data" });
  }
});

// ✅ DELETE Block (cascade: removes its Nyay Panchayats + Villages)
router.delete("/block/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const block = await Block.findById(id);
    if (!block) return res.status(404).json({ error: "Block not found" });

    // Delete all related Nyay Panchayats and Villages
    const deletedPanchayats = await NyayPanchayat.deleteMany({ blockId: id });
    const deletedVillages = await Village.deleteMany({ blockId: id });

    // Delete the block itself
    await Block.findByIdAndDelete(id);

    res.json({
      message: `Block '${block.name}' deleted successfully.`,
      deleted: {
        nyayPanchayats: deletedPanchayats.deletedCount,
        villages: deletedVillages.deletedCount,
      },
    });
  } catch (err) {
    console.error("Delete Block Error:", err);
    res.status(500).json({ error: "Failed to delete Block and related data." });
  }
});

// ✅ DELETE Nyay Panchayat (cascade: removes its Villages)
router.delete("/nyaypanchayat/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const np = await NyayPanchayat.findById(id);
    if (!np) return res.status(404).json({ error: "Nyay Panchayat not found" });

    // Delete all villages under this Nyay Panchayat
    const deletedVillages = await Village.deleteMany({ nyayPanchayatId: id });

    // Delete the Panchayat itself
    await NyayPanchayat.findByIdAndDelete(id);

    res.json({
      message: `Nyay Panchayat '${np.name}' deleted successfully.`,
      deleted: { villages: deletedVillages.deletedCount },
    });
  } catch (err) {
    console.error("Delete Nyay Panchayat Error:", err);
    res.status(500).json({ error: "Failed to delete Nyay Panchayat and villages." });
  }
});

// ✅ DELETE Village (just deletes one)
router.delete("/village/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const village = await Village.findByIdAndDelete(id);
    if (!village) return res.status(404).json({ error: "Village not found" });

    res.json({ message: `Village '${village.name}' deleted successfully.` });
  } catch (err) {
    console.error("Delete Village Error:", err);
    res.status(500).json({ error: "Failed to delete Village." });
  }
});

// ✅ Update Block Name
router.put("/block/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name is required." });

    const updatedBlock = await Block.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedBlock) return res.status(404).json({ error: "Block not found." });

    res.json({ message: "Block name updated successfully.", block: updatedBlock });
  } catch (err) {
    console.error("Update Block Error:", err);
    res.status(500).json({ error: "Failed to update block name." });
  }
});

// ✅ Update Nyay Panchayat Name
router.put("/nyaypanchayat/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name is required." });

    const updatedNP = await NyayPanchayat.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedNP)
      return res.status(404).json({ error: "Nyay Panchayat not found." });

    res.json({ message: "Nyay Panchayat name updated successfully.", nyayPanchayat: updatedNP });
  } catch (err) {
    console.error("Update Nyay Panchayat Error:", err);
    res.status(500).json({ error: "Failed to update Nyay Panchayat name." });
  }
});

// ✅ Update Village Name
router.put("/village/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: "Name is required." });

    const updatedVillage = await Village.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedVillage)
      return res.status(404).json({ error: "Village not found." });

    res.json({ message: "Village name updated successfully.", village: updatedVillage });
  } catch (err) {
    console.error("Update Village Error:", err);
    res.status(500).json({ error: "Failed to update Village name." });
  }
});


module.exports = router;