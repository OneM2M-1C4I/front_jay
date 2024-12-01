const express = require("express");
const path = require("path");

const router = express.Router();

// 학생 페이지
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/student.html"));
});

// 위급 상황 알림
router.post("/emergency", (req, res) => {
  console.log("Emergency alert received!");
  // 이곳에서 관리자에게 알림을 보내는 로직 구현 가능
  res.json({ message: "Emergency alert sent to administrator!" });
});

module.exports = router;
