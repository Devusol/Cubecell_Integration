const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const port = 8080;
const elapsedMax = 18;
const downlinkURL =
  "https://console.helium.com/api/v1/down/67d97e64-2cbd-42b5-b11f-e5e4f99e2eed/dAdVXsOqN4P_P4EaKXSu3CbkQk1zLpeg/2d635b83-c1a8-48fa-a334-60a251c00697";
let count = 0;
let timerec = Date.now();
let sendString = "status";
let clearHeliumDownlink = "__clear_downlink_queue__";

app.use(express.json());
app.use(cors());

app.post("/", function (req, res) {
  console.log(req.body.port);
  const bufferObj = Buffer.from(req.body.payload, "base64");
  console.log(bufferObj);
  if (req.body.port == 2) {
    console.log("it's data, lets save it to a file");

    fs.appendFile("./rawdata.dat", bufferObj.toString("hex") + "\n", (err) => {
      if (err) return console.log(err);
      console.log("Saving Data");
    });
  } else if (req.body.port == 3) {
    console.log("it's status report");
    const batt = bufferObj.readUInt16BE();
    const sysTime = bufferObj.readUInt32BE(2);
    const degF = bufferObj.readUInt8(6);
    console.log(
      `Battery Level: ${batt} System Time: ${Date(sysTime).toLocaleString(
        "en-US",
        {
          timeZone: "America/New_York"
        }
      )} System Temp: ${degF}`
    );
  } else if (req.body.port == 4) {
    console.log("it's live data");
  } else {
    console.log("not sure what it is");
    console.log(req.body.port);
  }

  // timerec = Math.round(Date.now() / 1000);
  // console.log(timerec);
  // let buff = Buffer.alloc(4);
  //buff.writeUInt32BE(timerec + 7);
  // let buff = new Buffer(sendString);
  // let base64data = buff.toString("base64");

  // axios
  //   .post(downlinkURL, {
  //     payload_raw: base64data,
  //     port: 10,
  //     confirmed: false
  //   })
  //   .then(function (response) {
  //     console.log(response);
  //     res.send(response.data);
  //   })
  //   .catch(function (error) {
  //     console.log(error);
  //   });

  // const millis = Date.now() - timerec;
  // const elapsed = Math.floor(millis / 1000);
  // const batt = bufferObj.readUint16BE();
  // const temp1 = bufferObj.readUint16BE(2);
  // const temp2 = bufferObj.readUInt16BE(7);
  // const temp3 = bufferObj.readUInt16BE(9);
  // //console.log(bufferObj.toString("hex"));
  // console.log(
  //   "Time Stamp: ",
  //   timestamp.toLocaleString("en-US", { timeZone: "America/New_York" })
  // );

  // console.log(`Battery: ${batt / 1000} volts`);
  // console.log(`Temp1: ${degFahrenheit(temp1)} °F`);
  // console.log(`Temp2: ${degFahrenheit(temp2)} °F`);
  // console.log(`Temp3: ${degFahrenheit(temp3)} °F`)
  // for (const value of bufferObj.values()) {
  //   console.log(value.toString());
  // }

  // if (elapsed > elapsedMax) {
  //   console.log("count: ", count, "elapsed time: ", elapsed, " missed some");
  //   //  console.log(bufferObj);
  //   count = 0;
  // } else {
  //   console.log(
  //     `count: ${count} elapsed time: ${elapsed} sec recieved: ${bufferObj.length}`
  //   );
  // }
  // count++;
  timerec = Date.now();
  //console.log(req.body.payload);
  //.toString());

  //res.send("thank you from post route");
});

app.post("/get_status", (req, res) => {
  let buff = new Buffer(sendString);
  let base64data = buff.toString("base64");
  // console.log(
  //   '"' + sendString + '" converted to Base64 is "' + base64data + '"'
  // );

  console.log("set post route");
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

app.post("/set", (req, res) => {
  console.log("get status route");
  axios
    .post(downlinkURL, {
      payload_raw: base64data,
      port: 10,
      confirmed: false
    })
    .then(function (response) {
      console.log(response);
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.post("/live", (req, res) => {
  console.log("get status route");
  axios
    .post(downlinkURL, {
      payload_raw: base64data,
      port: 11,
      confirmed: false
    })
    .then(function (response) {
      console.log(response);
      res.send(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
});

app.get("/", (req, res) => {
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
  parseRawData();
  console.log(buffStore);
  let saveIt = buff.join(",");
  console.log(saveIt);
  // const batt = buff.readUInt16BE();
  // const sysTime = buff.readUInt32BE(2);
  // const degF = buff.readUInt8(6);
  // // console.log(
  //   `buffBattery Level: ${batt} System Time: ${sysTime} System Temp: ${degF}`
  // );
  res.sendFile(path.join(__dirname, "/ui.html"));
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
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
