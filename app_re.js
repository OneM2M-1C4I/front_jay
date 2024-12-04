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

app.listen(config.app.port, function () {
  console.log("Simulator API listening on port " + config.app.port);
});

