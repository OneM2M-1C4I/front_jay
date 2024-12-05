var express = require("express");
var request = require("request");
var hashmap = require("hashmap");
var config = require("config");
var path = require("path");
var bodyParser = require("body-parser");

var app = express();
var map = new hashmap();

app.use(bodyParser.json({ type: ["application/*+json", "application/json"] }));

// Define the static file path
app.use(express.static(__dirname + "/public"));

// var cseURL = "http://" + config.cse.ip + ":" + config.cse.port;
// var cseRelease = config.cse.release;
// var templates = config.templates;
// var acpi = {};
// var requestNr = 0;

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/index.html"));
});

app.get("/seat", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/seat.html"));
});

const userDB = JSON.parse(fs.readFileSync("userDB.json", "utf-8"));
// 로그인 API
app.post("/api/login", (req, res) => {
  const { loginId, loginPassword } = req.body;
  const user = userDB.find(
    (user) => user.id === loginId && user.password === loginPassword
  );
  if (user) {
    res.status(200).json({
      success: true,
      message: "로그인 성공",
      user: {
        name: user.name,
        role: user.role,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "아이디 또는 비밀번호가 잘못되었습니다.",
    });
  }
});

app.listen(config.app.port, function () {
  console.log("Simulator API listening on port " + config.app.port);
});

