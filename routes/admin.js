const express = require('express');
const router = express.Router();
require ('dotenv').config();

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
    res.render("admin-login", { error: "गलत यूज़रनेम या पासवर्ड" });
  }
});

router.get('/login', (req, res) => {
  res.render('admin-login');
});

router.get("/dashboard", requireAdmin, (req, res) => {
  res.render("admin");
});

router.get("/family/search", async (req, res) => {
  try {
    const { block, village, nyayPanchayat } = req.query;

    let query = {};
    if (block) query.block = block;
    if (village) query.village = village;
    if (nyayPanchayat) query.nyayPanchayat = nyayPanchayat;
    const families = await Family.find(query);
    res.json(families);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

module.exports = router;