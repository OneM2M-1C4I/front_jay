const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios"); // HTTP 요청을 위해 axios 사용

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const TINYIOT_URL = "http://34.122.123.241:3000"; // TinyIoT 서버 URL

// Local storage for seat and posture data
let seatStatus = Array(21).fill({ active: false }); // 21 seats, default inactive
let postureData = Array(21).fill(0); // Default posture data

// Synchronize with TinyIoT devices
async function fetchTinyIoTDevices() {
  try {
    const response = await axios.get(`${TINYIOT_URL}/devices`);
    const devices = response.data;

    devices.forEach((device) => {
      if (device.id.includes("seat")) {
        const seatIndex = parseInt(device.id.replace("seat", ""), 10) - 1;
        seatStatus[seatIndex] = { active: device.value > 0 };
        postureData[seatIndex] = device.value;
      }
    });
    console.log("Synchronized with TinyIoT devices.");
  } catch (error) {
    console.error("Failed to synchronize with TinyIoT:", error.message);
  }
}

// Fetch TinyIoT data on server startup
fetchTinyIoTDevices();

// Endpoint to update seat status
app.post("/update-seat-status", async (req, res) => {
  const { seatNumber, status } = req.body;
  const active = status === "active";

  // Update local state
  seatStatus[seatNumber - 1] = { active };
  postureData[seatNumber - 1] = active ? Math.floor(Math.random() * 10) + 1 : 0;

  // Send update to TinyIoT
  try {
    await axios.post(`${TINYIOT_URL}/devices/seat${seatNumber}`, {
      value: active ? 1 : 0,
    });
    res.status(200).send("Seat status updated and synchronized with TinyIoT.");
  } catch (error) {
    console.error("Failed to update TinyIoT device:", error.message);
    res.status(500).send("Failed to update TinyIoT device.");
  }
});

// Endpoint to get seat status
app.get("/get-seat-status", (req, res) => {
  res.json(seatStatus);
});

// Endpoint to get posture data
app.get("/get-posture-data", (req, res) => {
  res.json({
    labels: Array.from({ length: 21 }, (_, i) => `Seat ${i + 1}`),
    values: postureData,
  });
});

// Start server
const PORT = 8369;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
