const express = require("express");
const app = express();
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const port = 8080 || process.env.port;
const downlinkURL =
  "https://console.helium.com/api/v1/down/67d97e64-2cbd-42b5-b11f-e5e4f99e2eed/dAdVXsOqN4P_P4EaKXSu3CbkQk1zLpeg/2d635b83-c1a8-48fa-a334-60a251c00697";
let server,
  io,
  count = 0,
  timerec = Date.now(),
  clearHeliumDownlink = "__clear_downlink_queue__",
  savePath = path.join(__dirname, "public");

server = http.Server(app);
server.listen(port);

io = socketIO(server);

io.on("connection", function (socket) {
  console.log("user connected");
  socket.emit("status-stamp", {
    status: "Waiting for data..."
  });
  // socket.on("greeting-from-client", function (message) {
  //   console.log(message);
  // });
});

app.set("view engine", ejs);
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());

app.get("/getLive", (req, res) => {
  console.log("getLive Route");
  let buff = Buffer.from("start");
  let base64data = buff.toString("base64");
  axios
    .post(downlinkURL, {
      payload_raw: base64data,
      port: 10,
      confirmed: false
    })
    .then(function (response) {
      console.log(response.data);
      res.redirect("/");
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/stopLive", function (req, res) {
  console.log("stopLive Route");
  let buff = Buffer.from("stop");
  let base64data = buff.toString("base64");
  axios
    .post(downlinkURL, {
      payload_raw: base64data,
      port: 16,
      confirmed: false
    })
    .then(function (response) {
      console.log(response.data);
      res.redirect("/");
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/", (req, res) => {
  // console.log(req.body);
  const bufferObj = Buffer.from(req.body.payload, "base64");
  console.log(bufferObj);

  if (req.body.port == 2) {
    console.log("it's data, lets save it to a file");

    fs.appendFile(savePath, bufferObj.toString("hex") + "\n", (err) => {
      if (err) return console.log(err);
      console.log("Saving Data");
    });

    for (const b of bufferObj) {
      console.log(b);
      const sysTime = bufferObj.readUInt32LE();
      const a = bufferObj.readUInt16BE(4);
      const aa = bufferObj.readUInt8(6);
      const b = bufferObj.readUInt16BE(7);
      const bb = bufferObj.readUInt8(9);
      const c = bufferObj.readUInt16BE(10);
      const cc = bufferObj.readUInt8(12);
      const d = bufferObj.readUInt16BE(13);
      const dd = bufferObj.readUInt8(15);
    }
  } else if (req.body.port == 3) {
    console.log("it's status report");
    const batt = bufferObj.readUInt16BE();
    const sysTime = bufferObj.readUInt32BE(2);
    const degF = bufferObj.readUInt8(6);
    const sysDate = Date(sysTime).toLocaleTimeString();
    console.log(sysDate);
    let paramsData = `Batt: ${
      batt / 1000
    } V Sys Time: ${sysDate} Sys Temp: ${degF}`;

    io.emit("status-stamp", {
      status: paramsData
    });
  } else if (req.body.port == 4) {
    console.log("it's live data");
    const sysTime = bufferObj.readUInt32LE();
    const a = bufferObj.readUInt16BE(4);
    const aa = bufferObj.readUInt8(6);
    const b = bufferObj.readUInt16BE(7);
    const bb = bufferObj.readUInt8(9);
    const c = bufferObj.readUInt16BE(10);
    const cc = bufferObj.readUInt8(12);
    const d = bufferObj.readUInt16BE(13);
    const dd = bufferObj.readUInt8(15);
    console.log(sysTime);
    console.log(
      `time  ${Date(sysTime).toLocaleString("en-US", {
        timeZone: "America/New_York"
      })} LC1: ${a}.${aa} LC2: ${b}.${bb} LC3: ${c}.${cc} LC4: ${d}.${dd}`
    );
    io.emit("live-data", {
      lc1: `${a}.${aa}`,
      lc2: `${b}.${bb}`,
      lc3: `${c}.${cc}`,
      lc4: `${d}.${dd}`
    });
  } else {
    console.log("not sure what it is");
    console.log(req.body.port);
  }
  return res.send("heard you");
});

app.get("/", (req, res) => {
  console.log(savePath);

  let buff = Buffer.from([
    0x10, 0x3b, 0x0c7, 0x62, 0x15, 0x00, 0x06, 0x0a, 0x2e, 0x00, 0x08, 0x18,
    0x00, 0xf7, 0x00, 0xfe
  ]);
  let buffStore = buff.toString("hex");

  let saveIt = buff.join(",");
  // console.log(saveIt);
  const batt = buff.readUInt16BE();
  const sysTime = buff.readUInt32BE(2);
  const degF = buff.readUInt8(6);

  res.render("index.ejs");
});

app.post("/cal", (req, res) => {
  console.log("calibrate Route: ", req.body);
  let buff = Buffer.from("calibrate");
  let base64data = buff.toString("base64");
  let calPort = 11;

  //if (check for req.body.values) then set port value
  //either 11,12,13,14 to calibrate 1, 2, 3, 4

  axios
    .post(downlinkURL, {
      payload_raw: base64data,
      port: calPort,
      confirmed: false
    })
    .then(function (response) {
      console.log(response.data);
      res.redirect("/");
    })
    .catch(function (error) {
      console.log(error);
    });
});

const parseRawData = () => {
  fs.readFile("./rawdata.dat", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    //  console.log(data);
    // fs.appendFile("./rawdata.dat", buffStore + "\n", (err) => {
    //   if (err) return console.log(err);
    //   console.log("Saving Data");
    // });
    //parseRawData();
    // console.log(buffStore);
  });
};

const degFahrenheit = (temp) => {
  return ((temp / 10) * 1.8 + 32).toFixed(2);
};

const sendTime = () => {
  // timerec = Math.round(Date.now() / 1000);
  // console.log(timerec);
  // let buff = Buffer.alloc(4);
  // buff.writeUInt32BE(timerec + 7);
  // let base64data = buff.toString("base64");
  // let t = 1656857613;
  // let tBuf = Buffer.alloc(4);
  // tBuf.writeUInt32BE(t);
  // console.log(tBuf);
};
