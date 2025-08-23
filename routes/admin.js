const express = require('express');
const router = express.Router();
require ('dotenv').config();
const Family = require('../models/family');
const Member = require('../models/member');

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

router.get('/add-member', requireAdmin, (req, res) => {
  res.render('addMember', { activePage: "" });
});

router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const families = await Family.find().sort({ createdAt: 1 });
    res.render("admin", { families, activePage: "dashboard" }); 
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

router.get("/search-family", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);

    const families = await Family.find({
      $or: [
        { lineageName: { $regex: q, $options: "i" } },
        { village: { $regex: q, $options: "i" } }
      ]
    }).limit(10);

    res.json(families);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
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
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;