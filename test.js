const express = require("express");
const request = require("request");
const hashmap = require("hashmap");
const config = require("config");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const map = new hashmap();

app.use(bodyParser.json({ type: ["application/*+json", "application/json"] }));
app.use(express.static(__dirname + "/public")); // Serve static files

const cseURL = "http://" + config.cse.ip + ":" + config.cse.port;
const cseRelease = config.cse.release;
const templates = config.templates;
const activeAEs = {}; // 활성화된 AE 상태 저장
let requestNr = 0; // 요청 번호 카운터

// Serve the main page
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "public/index.html"))
);

// Serve the Student page
app.get("/student", (req, res) =>
  res.sendFile(path.join(__dirname, "public/student.html"))
);

// Serve the Admin page
app.get("/admin", (req, res) =>
  res.sendFile(path.join(__dirname, "public/admin.html"))
);

// Templates route
app.get("/templates", (req, res) => res.send(templates));

// AE 생성 시 활성화 상태 업데이트
function createAE(name) {
  console.log("\n[REQUEST] Creating AE:", name);
  activeAEs[name] = { activated: true, devices: {} }; // 활성화된 AE 상태와 하위 디바이스 추가
}

// 활성화된 AE 목록 API
app.get("/admin/aes", (req, res) => {
  res.status(200).json(activeAEs); // 활성화된 AE 목록 반환
});

// 좌석 활성화 상태 업데이트 API
app.post("/devices/:name", (req, res) => {
  const seatName = req.params.name;
  const type = req.query.type;

  if (type === "seat") {
    createAE(seatName); // 좌석을 활성화하고 AE 생성
    res.status(201).send(`Seat ${seatName} activated.`);
  } else {
    res.status(400).send("Invalid request type.");
  }
});

// 좌석 비활성화 상태 업데이트 API (좌석 삭제로 변경)
app.post("/devices/:name/deactivate", (req, res) => {
  const seatName = req.params.name;

  // 좌석이 존재하지 않으면 404 에러 반환
  if (!activeAEs[seatName]) {
    return res.status(404).send("Seat not found");
  }

  // 좌석 비활성화 및 하위 디바이스 비활성화
  deleteAE(seatName); // 좌석 삭제 (AE 제거)
  res.status(200).send(`${seatName} deactivated and deleted.`);
});

// 좌석 삭제 (deleteAE)
function deleteAE(name) {
  // 좌석 삭제 및 하위 디바이스 제거
  if (activeAEs[name]) {
    delete activeAEs[name]; // 좌석 및 하위 디바이스 제거
    console.log(`AE for seat ${name} and its sub-devices deleted.`);
  }
}

// 하위 디바이스 상태 업데이트 API
app.post("/devices/:name/:subDevice", (req, res) => {
  const seatName = req.params.name;
  const subDevice = req.params.subDevice;
  const action = req.query.action;

  // 좌석이 존재하지 않으면 404 에러 반환
  if (!activeAEs[seatName]) {
    return res.status(404).send("Seat not found");
  }

  // 하위 디바이스의 상태를 설정
  if (activeAEs[seatName].devices[subDevice] === undefined) {
    activeAEs[seatName].devices[subDevice] = {}; // 처음에는 빈 객체로 초기화
  }

  // 하위 디바이스의 상태를 변경
  activeAEs[seatName].devices[subDevice] = action === "on" ? true : false;

  console.log(`Sub-device ${subDevice} on ${seatName} is now ${action}`);
  res.status(200).send(`${subDevice} on ${seatName} is now ${action}`);
});

// Start server
app.listen(config.app.port || 8369, () => {
  console.log("Simulator API listening on port " + (config.app.port || 8369));
});
