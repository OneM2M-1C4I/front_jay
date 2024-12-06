var express = require("express");
var request = require("request");
var path = require("path");
var bodyParser = require("body-parser");
var fs = require("fs");

var app = express();
app.use(bodyParser.json({ type: ["application/*+json", "application/json"] }));

app.use(express.static(__dirname + "/public"));

let userDB = JSON.parse(fs.readFileSync("userDB.json", "utf-8"));

const tinyIoT_API = "http://34.122.123.241:3000/TinyIoT";

app.get("/seat", function (req, res) {
  res.sendFile(path.join(__dirname + "/public/seat.html"));
});

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
        seat: user.seat
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "아이디 또는 비밀번호가 잘못되었습니다.",
    });
  }
});

// 현재 DB 상의 모든 사용자 정보를 반환 (테스트용)
app.get("/api/users", (req, res) => {
  res.json(userDB);
});

// 좌석 사용 요청 API (user 전용)
// 로그인한 userId와 요청한 seatNumber를 받아 해당 좌석 사용 처리
app.post("/api/useSeat", async (req, res) => {
  const { userId, seatNumber } = req.body;
  const user = userDB.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  if (user.role !== 'user') {
    return res.status(403).json({ success: false, message: "Not a user role." });
  }
  if (user.seat && user.seat !== false) {
    return res.status(400).json({ success: false, message: "User already using a seat." });
  }

  // AE 및 Container 생성 로직
  const aeName = `Seat${seatNumber}`;
  // AE 삭제 후 생성 (초기화)
  await deleteAE(aeName).catch(e => {});
  await createAE(aeName);
  await createContainer(aeName, "SeatLight");
  await createCIN(aeName, "SeatLight", "Inactive");
  await createContainer(aeName, "SeatCamera");
  await createCIN(aeName, "SeatCamera", "Inactive");

  // DB 업데이트
  user.seat = seatNumber;
  fs.writeFileSync("userDB.json", JSON.stringify(userDB, null, 2), "utf-8");

  res.json({ success: true, message: `Seat ${seatNumber} is now used by ${userId}` });
});

// 좌석 퇴장 요청 API
app.post("/api/releaseSeat", async (req, res) => {
  const { userId } = req.body;
  const user = userDB.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  if (user.role !== 'user') {
    return res.status(403).json({ success: false, message: "Not a user role." });
  }

  if (user.seat === false) {
    return res.status(400).json({ success: false, message: "User is not using any seat." });
  }

  const seatNumber = user.seat;
  const aeName = `Seat${seatNumber}`;
  
  // AE 삭제
  await deleteAE(aeName);

  // DB 업데이트
  user.seat = false;
  fs.writeFileSync("userDB.json", JSON.stringify(userDB, null, 2), "utf-8");

  res.json({ success: true, message: `User ${userId} released seat ${seatNumber}` });
});

// 관리자 강제퇴장 API
app.post("/api/forceExit", async (req, res) => {
  const { seatNumber } = req.body;
  
  // 어떤 유저가 이 좌석을 쓰고 있는지 확인
  const user = userDB.find(u => u.seat === seatNumber);
  if (!user) {
    return res.status(404).json({ success: false, message: "No user found for this seat." });
  }

  // AE 삭제
  const aeName = `Seat${seatNumber}`;
  await deleteAE(aeName);

  // DB 업데이트
  user.seat = false;
  fs.writeFileSync("userDB.json", JSON.stringify(userDB, null, 2), "utf-8");

  res.json({ success: true, message: `Force exited seat ${seatNumber}` });
});

// 현재 어떤 좌석이 누구에 의해 사용 중인지 반환
app.get("/api/seatStatus", (req, res) => {
  // userDB를 조회하여 seat 상태를 반환
  const seatInfo = Array.from({length: 21}, (_, i) => {
    const seatNumber = i+1;
    const occupant = userDB.find(u => u.seat === seatNumber);
    return {
      number: seatNumber,
      userId: occupant ? occupant.id : null
    };
  });
  res.json(seatInfo);
});

async function createAE(aeName) {
  const url = tinyIoT_API;
  const headers = {
    "X-M2M-RI": `req${Date.now()}`,
    "X-M2M-RVI": "2a",
    "X-M2M-origin": `C${aeName}`,
    "Content-Type": "application/json;ty=2",
  };

  const payload = {
    "m2m:ae": {
        rn: aeName,
        api: `N.${aeName}`,
        rr: true,
    },
  };

  await fetch(url, {
    method: "POST",
    headers: new Headers(headers),
    body: JSON.stringify(payload),
  });
}

async function deleteAE(aeName) {
  const url = `${tinyIoT_API}/${aeName}`;
  const headers = {
    "X-M2M-RI": `req${Date.now()}`,
    "X-M2M-RVI": "2a",
    "X-M2M-origin": `CAdmin`,
  };

  await fetch(url, {
    method: "DELETE",
    headers: new Headers(headers),
  });
}

async function createContainer(aeName, containerName) {
  const url = `${tinyIoT_API}/${aeName}`;
  const headers = {
      "X-M2M-RI": `req${Date.now()}`,
      "X-M2M-RVI": "2a",
      "X-M2M-origin": `C${containerName}`,
      "Content-Type": "application/json;ty=3",
  };

  const payload = {
      "m2m:cnt": {
          rn: containerName,
      },
  };

  await fetch(url, {
      method: "POST",
      headers: new Headers(headers),
      body: JSON.stringify(payload),
  });
}

async function createCIN(aeName, containerName, content) {
  const url = `${tinyIoT_API}/${aeName}/${containerName}`;
  const headers = {
      "X-M2M-RI": `req${Date.now()}`,
      "X-M2M-RVI": "2a",
      "X-M2M-origin": `C${containerName}`,
      "Content-Type": "application/json;ty=4",
  };

  await fetch(url, {
      method: "POST",
      headers: new Headers(headers),
      body: JSON.stringify({
          "m2m:cin": {
              con: content,
          },
      }),
  });
}

app.listen(8369, function () {
  console.log("Simulator API listening on port 3000");
});
