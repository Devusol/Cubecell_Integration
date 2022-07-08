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
const elapsedMax = 18;
const downlinkURL =
  "https://console.helium.com/api/v1/down/67d97e64-2cbd-42b5-b11f-e5e4f99e2eed/dAdVXsOqN4P_P4EaKXSu3CbkQk1zLpeg/2d635b83-c1a8-48fa-a334-60a251c00697";
let server,
  io,
  count = 0,
  timerec = Date.now(),
  sendString = "status",
  clearHeliumDownlink = "__clear_downlink_queue__";

server = http.Server(app);
server.listen(port);

io = socketIO(server);

io.on("connection", function (socket) {
  console.log("user connected");
  socket.emit("greeting-from-server", {
    greeting: "Waiting for data..."
  });
  socket.on("greeting-from-client", function (message) {
    console.log(message);
  });
});

app.set("view engine", ejs);
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());

app.get("/getLive", (req, res) => {
  console.log("getLive Route");
  let buff = Buffer.from(sendString);
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
});

app.post("/", (req, res) => {
  console.log(req.body.port);
  const bufferObj = Buffer.from(req.body.payload, "base64");
  console.log(bufferObj);
  if (req.body.port == 2) {
    console.log("it's data, lets save it to a file");

    // fs.appendFile("./rawdata.dat", bufferObj.toString("hex") + "\n", (err) => {
    //   if (err) return console.log(err);
    //   console.log("Saving Data");
    // });
  } else if (req.body.port == 3) {
    console.log("it's status report");
    const batt = bufferObj.readUInt16BE();
    const sysTime = bufferObj.readUInt32BE(2);
    const degF = bufferObj.readUInt8(6);
    let paramsData = `Battery Level: ${batt} System Time: ${Date(
      sysTime
    ).toLocaleString("en-US", {
      timeZone: "America/New_York"
    })} System Temp: ${degF}`;
    io.emit("greeting-from-server", {
      greeting: paramsData
    });
    return res.send("heard you");
  } else if (req.body.port == 4) {
    console.log("it's live data");
    const sysTime = bufferObj.readUInt32BE();
    const a = bufferObj.readUInt16BE(4);
    const aa = bufferObj.readUInt8(6);
    const b = bufferObj.readUInt16BE(7);
    const bb = bufferObj.readUInt8(9);
    const c = bufferObj.readUInt16BE(10);
    const cc = bufferObj.readUInt8(12);
    const d = bufferObj.readUInt16BE(13);
    const dd = bufferObj.readUInt8(15);

    console.log(
      `time  ${Date(sysTime).toLocaleString("en-US", {
        timeZone: "America/New_York"
      })} LC1: ${a}.${aa} LC2: ${b}.${bb} LC3: ${c}.${cc} LC4: ${d}.${dd}`
    );
    // io.emit("greeting-from-server", {
    //   greeting: paramsData
    // });
  } else {
    console.log("not sure what it is");
    console.log(req.body.port);
  }
});

app.get("/", (req, res) => {
  console.log(req.query);
  // timerec = Math.round(Date.now() / 1000);
  // console.log(timerec);
  // let buff = Buffer.alloc(4);
  // buff.writeUInt32BE(timerec + 7);
  // let base64data = buff.toString("base64");
  // let t = 1656857613;
  // let tBuf = Buffer.alloc(4);
  // tBuf.writeUInt32BE(t);
  // console.log(tBuf);
  let buff = Buffer.from([0x10, 0x66, 0x0d, 0xa4, 0xc1, 0x62, 0x21, 0xff]);
  let buffStore = buff.toString("hex");
  // fs.appendFile("./rawdata.dat", buffStore + "\n", (err) => {
  //   if (err) return console.log(err);
  //   console.log("Saving Data");
  // });
  //parseRawData();
  console.log(buffStore);
  let saveIt = buff.join(",");
  console.log(saveIt);
  // const batt = buff.readUInt16BE();
  // const sysTime = buff.readUInt32BE(2);
  // const degF = buff.readUInt8(6);
  // // console.log(
  //   `buffBattery Level: ${batt} System Time: ${sysTime} System Temp: ${degF}`
  // );
  res.render("index.ejs");
});

app.get("/calibrate", (req, res) => {
  console.log(req.query);
  // timerec = Math.round(Date.now() / 1000);
  // console.log(timerec);
  // let buff = Buffer.alloc(4);
  // buff.writeUInt32BE(timerec + 7);
  // let base64data = buff.toString("base64");
  // let t = 1656857613;
  // let tBuf = Buffer.alloc(4);
  // tBuf.writeUInt32BE(t);
  // console.log(tBuf);
  let buff = Buffer.from([0x10, 0x66, 0x0d, 0xa4, 0xc1, 0x62, 0x21, 0xff]);
  let buffStore = buff.toString("hex");
  fs.appendFile("./rawdata.dat", buffStore + "\n", (err) => {
    if (err) return console.log(err);
    console.log("Saving Data");
  });
  //parseRawData();
  console.log(buffStore);
  let saveIt = buff.join(",");
  console.log(saveIt);
  // const batt = buff.readUInt16BE();
  // const sysTime = buff.readUInt32BE(2);
  // const degF = buff.readUInt8(6);
  // // console.log(
  //   `buffBattery Level: ${batt} System Time: ${sysTime} System Temp: ${degF}`
  // );
  res.render("calibrate.ejs");
});

const parseRawData = () => {
  fs.readFile("./rawdata.dat", "utf8", (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    //  console.log(data);
  });
};

const degFahrenheit = (temp) => {
  return ((temp / 10) * 1.8 + 32).toFixed(2);
};
// function Decoder(bytes, port) {
//   var mode = (bytes[6] & 0x7c) >> 2;
//   var decode = {};
//   if (mode != 2) {
//     decode.BatV = ((bytes[0] << 8) | bytes[1]) / 1000;
//     decode.TempC1 = parseFloat(
//       ((((bytes[2] << 24) >> 16) | bytes[3]) / 10).toFixed(2)
//     );
//     decode.ADC_CH0V = ((bytes[4] << 8) | bytes[5]) / 1000;
//     decode.Digital_IStatus = bytes[6] & 0x02 ? "H" : "L";
//     if (mode != 6) {
//       decode.EXTI_Trigger = bytes[6] & 0x01 ? "TRUE" : "FALSE";
//       decode.Door_status = bytes[6] & 0x80 ? "CLOSE" : "OPEN";
//     }
//   }

//   if (mode == "0") {
//     decode.Work_mode = "IIC";
//     if (((bytes[9] << 8) | bytes[10]) === 0) {
//       decode.Illum = ((bytes[7] << 24) >> 16) | bytes[8];
//     } else {
//       decode.TempC_SHT = parseFloat(
//         ((((bytes[7] << 24) >> 16) | bytes[8]) / 10).toFixed(2)
//       );
//       decode.Hum_SHT = parseFloat(
//         (((bytes[9] << 8) | bytes[10]) / 10).toFixed(1)
//       );
//     }
//   } else if (mode == "1") {
//     decode.Work_mode = " Distance";
//     decode.Distance_cm = parseFloat(
//       (((bytes[7] << 8) | bytes[8]) / 10).toFixed(1)
//     );
//     if (((bytes[9] << 8) | bytes[10]) != 65535) {
//       decode.Distance_signal_strength = parseFloat(
//         ((bytes[9] << 8) | bytes[10]).toFixed(0)
//       );
//     }
//   } else if (mode == "2") {
//     decode.Work_mode = " 3ADC";
//     decode.BatV = bytes[11] / 10;
//     decode.ADC_CH0V = ((bytes[0] << 8) | bytes[1]) / 1000;
//     decode.ADC_CH1V = ((bytes[2] << 8) | bytes[3]) / 1000;
//     decode.ADC_CH4V = ((bytes[4] << 8) | bytes[5]) / 1000;
//     decode.Digital_IStatus = bytes[6] & 0x02 ? "H" : "L";
//     decode.EXTI_Trigger = bytes[6] & 0x01 ? "TRUE" : "FALSE";
//     decode.Door_status = bytes[6] & 0x80 ? "CLOSE" : "OPEN";

//     if (((bytes[9] << 8) | bytes[10]) === 0) {
//       decode.Illum = ((bytes[7] << 24) >> 16) | bytes[8];
//     } else {
//       decode.TempC_SHT = parseFloat(
//         ((((bytes[7] << 24) >> 16) | bytes[8]) / 10).toFixed(2)
//       );
//       decode.Hum_SHT = parseFloat(
//         (((bytes[9] << 8) | bytes[10]) / 10).toFixed(1)
//       );
//     }
//   } else if (mode == "3") {
//     decode.Work_mode = "3DS18B20";
//     decode.TempC2 = parseFloat(
//       ((((bytes[7] << 24) >> 16) | bytes[8]) / 10).toFixed(2)
//     );

//     decode.TempC3 = parseFloat(
//       ((((bytes[9] << 24) >> 16) | bytes[10]) / 10).toFixed(2)
//     );
//   } else if (mode == "4") {
//     decode.Work_mode = "Weight";
//     decode.Weight = ((bytes[7] << 24) >> 16) | bytes[8];
//   } else if (mode == "5") {
//     decode.Work_mode = "Count";
//     decode.Count =
//       (bytes[7] << 24) | (bytes[8] << 16) | (bytes[9] << 8) | bytes[10];
//   }

//   if (bytes.length == 11 || bytes.length == 12) {
//     return decode;
//   }
// }
