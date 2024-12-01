const express = require("express");
const request = require("request");
const hashmap = require("hashmap");
const config = require("config");

const router = express.Router();
const map = new hashmap();

const cseURL = `http://${config.cse.ip}:${config.cse.port}`;
const cseRelease = config.cse.release;
const templates = config.templates;
let requestNr = 0;

// Get all devices
router.get("/", (req, res) => {
  const devices = [];
  map.forEach((value, key) => {
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

// Create a seat and sub-devices
router.post("/:name", (req, res) => {
  const seatName = req.params.name;
  const type = req.query.type;

  if (type === "seat") {
    // Create main seat device
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

// Delete a device
router.delete("/:name", (req, res) => {
  const deviceName = req.params.name;
  map.remove(deviceName);
  deleteAE(deviceName);
  res.sendStatus(204);
});

// Create a new device
function createDevice(typeIndex, name) {
  const object = {
    typeIndex: typeIndex,
    type: templates[typeIndex].type,
    data: 0, // Default data
    icon: templates[typeIndex].icon,
    unit: templates[typeIndex].unit,
    stream: templates[typeIndex].stream,
  };

  map.set(name, object);
  createAE(name, typeIndex); // Create device entry in AE
}

// Create Application Entity (AE)
function createAE(name, typeIndex) {
  const options = {
    uri: `${cseURL}/${config.cse.name}`,
    method: "POST",
    headers: {
      Accept: "application/json",
      "X-M2M-Origin": `C${name}`,
      "X-M2M-RI": `req${requestNr}`,
      "X-M2M-RVI": "2a",
      "Content-Type": "application/json; ty=2",
    },
    json: {
      "m2m:ae": {
        rn: name,
        api: `N${name}`,
        rr: false,
      },
    },
  };

  requestNr += 1;

  request(options, (error, response) => {
    if (error) {
      console.error("Error creating AE:", error);
    } else {
      console.log(`AE created for ${name}:`, response.statusCode);
    }
  });
}

// Delete Application Entity (AE)
function deleteAE(name) {
  const options = {
    uri: `${cseURL}/${config.cse.name}/${name}`,
    method: "DELETE",
    headers: {
      "X-M2M-Origin": `C${name}`,
      "X-M2M-RI": `req${requestNr}`,
      "X-M2M-RVI": "2a",
    },
  };

  requestNr += 1;

  request(options, (error, response) => {
    if (error) {
      console.error("Error deleting AE:", error);
    } else {
      console.log(`AE deleted for ${name}:`, response.statusCode);
    }
  });
}

module.exports = router;
