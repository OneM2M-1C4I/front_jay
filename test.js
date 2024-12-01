var express = require("express");
var request = require("request");
var hashmap = require("hashmap");
var config = require("config");
var path = require("path");
var bodyParser = require("body-parser");

var app = express();
var map = new hashmap();

app.use(bodyParser.json({ type: ["application/*+json", "application/json"] }));
app.use(express.static(__dirname + "/public")); // Serve static files

var cseURL = "http://" + config.cse.ip + ":" + config.cse.port;
var cseRelease = config.cse.release;
var templates = config.templates;
var acpi = {};
var requestNr = 0;

// Serve the main page
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve the Student page
app.get("/student", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

// Serve the Admin page
app.get("/admin", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Templates route
app.get("/templates", function (req, res) {
  res.send(templates);
});

// Get all devices
app.get("/devices", function (req, res) {
  var devices = [];
  map.forEach(function (value, key) {
    devices.push({
      typeIndex: value.typeIndex,
      name: key,
      type: value.type,
      data: value.data,
      icon: value.icon,
      unit: value.unit,
      stream: value.stream,
    });
  });
  res.send(devices);
});

// Delete a device
app.delete("/devices/:name", function (req, res) {
  map.remove(req.params.name);
  deleteAE(req.params.name);

  res.sendStatus(204);
});

// Create a seat and its sub-devices
app.post("/devices/:name", function (req, res) {
  const seatName = req.params.name;
  const type = req.query.type;

  if (type === "seat") {
    // Create seat
    createDevice(0, seatName);

    // Create sub-devices (Camera, Light, LED)
    const devices = ["Camera", "Light", "LED"];
    devices.forEach((deviceType, index) => {
      const deviceName = `${seatName}_${deviceType}`;
      createDevice(index + 1, deviceName);
    });

    console.log(`Seat ${seatName} and sub-devices created.`);
    res.status(201).send(`Seat ${seatName} and sub-devices created.`);
  } else {
    res.status(400).send("Invalid request type.");
  }
});

// Update sub-device status (Camera, Light, LED)
app.post("/devices/:name/:subDevice", function (req, res) {
  const deviceName = req.params.name; // e.g., Seat1
  const subDevice = req.params.subDevice; // e.g., Camera, Light, LED
  const action = req.query.action; // e.g., "on" or "off"

  // Check if the device exists
  if (!map.has(deviceName)) {
    return res.status(404).send("Device not found");
  }

  // Sub-device name
  const subDeviceName = `${deviceName}_${subDevice}`;

  // Update sub-device status
  if (map.has(subDeviceName)) {
    const device = map.get(subDeviceName);

    // Update the device data to reflect the action
    device.data = action === "on" ? 1 : 0;
    map.set(subDeviceName, device);

    console.log(`${subDeviceName} is now ${action}`);
    return res.status(200).send(`${subDeviceName} is now ${action}`);
  } else {
    return res.status(404).send("Sub-device not found");
  }
});

// Get sub-device status
app.get("/devices/:name/:subDevice", function (req, res) {
  const deviceName = req.params.name;
  const subDevice = req.params.subDevice;

  // Sub-device name
  const subDeviceName = `${deviceName}_${subDevice}`;

  // Check if the sub-device exists
  if (map.has(subDeviceName)) {
    const device = map.get(subDeviceName);
    return res.status(200).json({
      name: subDeviceName,
      data: device.data,
      type: device.type,
    });
  } else {
    return res.status(404).send("Sub-device not found");
  }
});

// Start server
app.listen(config.app.port || 8369, function () {
  console.log("Simulator API listening on port " + (config.app.port || 8369));
});

// Helper functions for creating devices, updating devices, etc.
// (Keep all existing helper functions like createDevice, createAE, deleteAE, etc. as they were in your original code)
