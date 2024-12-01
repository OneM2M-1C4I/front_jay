const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(express.static("public"));

let seatStatus = Array(21).fill({ active: false }); // 21 seats, default inactive
let postureData = Array(21).fill(0); // Default posture data

// Endpoint to update seat status
app.post("/update-seat-status", (req, res) => {
  const { seatNumber, status } = req.body;
  seatStatus[seatNumber - 1] = { active: status === "active" };
  postureData[seatNumber - 1] = status === "active" ? Math.floor(Math.random() * 10) + 1 : 0; // Random posture data
  res.status(200).send("Seat status updated.");
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

const PORT = 8369;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
