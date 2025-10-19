const express = require('express');
const router = express.Router();
require ('dotenv').config();
const Family = require('../models/family');
const Member = require('../models/member');
const multer = require('multer');
const XLSX = require('xlsx');

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

module.exports = router;