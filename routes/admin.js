const express = require("express");
const path = require("path");

const router = express.Router();

// 관리자 페이지
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/admin.html"));
});

module.exports = router;
