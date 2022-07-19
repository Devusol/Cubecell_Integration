require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const fs = require("fs");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
const serveIndex = require("serve-index");
const port = 3000 || process.env.port;
const downlinkURL = "https://console.helium.com/api/v1/down/311eaf7b-0e70-4d85-8723-5345632c4b30/EZ6PaaSHDpi4g8CN9LATkcVhAK2KjCty";
let server,
  io,
  count = 0,
  timerec = Date.now(),
  clearHeliumDownlink = "__clear_downlink_queue__",
  savePath = path.join(__dirname, "public/logs");

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
app.use(
  "/logs",
  express.static(savePath),
  serveIndex(savePath, { icons: true })
);

app.use(express.json());
app.use(cors());

app.get("/getLive", (req, res) => {
  console.log("getLive Route");
  let buff = Buffer.from("start");
  let base64data = buff.toString("base64");
  clearDownlink();
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
  clearDownlink();
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

// app.get("/update", function (req, res) {
//   let buff = Buffer.from("update");
//   let base64data = buff.toString("base64");
//   clearDownlink();
//   axios
//     .post(downlinkURL, {
//       payload_raw: base64data,
//       port: 12,
//       confirmed: false
//     })
//     .then(function (response) {
//       console.log(response.data);
//       res.redirect("/");
//     })
//     .catch(function (error) {
//       console.log(error);
//     });
// });

app.get("/tare", function (req, res) {
  let buff = Buffer.from("tare");
  let base64data = buff.toString("base64");
  clearDownlink();
  axios
    .post(downlinkURL, {
      payload_raw: base64data,
      port: 15,
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
  console.log(req.body.payload);
  const bufferObj = Buffer.from(req.body.payload, "base64");
  const buffCSV = Buffer.alloc(16);
  // console.log(bufferObj);

  if (req.body.port == 2) {
    console.log("it's data, lets save it to a file");
    //  console.log(bufferObj.toString("HEX"));
    fs.appendFile("rawdata.dat", bufferObj.toString("HEX") + "\n", (err) => {
      if (err) return console.log(err);
      // console.log("Saving Data");
    });

    // const dataStr = fs.readFileSync(savePath, "utf8");
    // const dataBuff = Buffer.from(dataStr, "HEX");
    const dataBuff = bufferObj;
    console.log(dataBuff);
    let index = 16;
    let makeCSV = "";

    for (const b of dataBuff.entries()) {
      //console.log(b);
      // makeCSV += `${b[1]}, `;

      if (b[0] == index) {
        dataBuff.copy(buffCSV, 0, index - 16, index);
        console.log(buffCSV);
        // const sysTime = buffCSV.readUInt32LE() * 1000;
        // var timestamp = new Date(1657335808 * 1000);
        makeCSV += `${buffCSV.readUInt32LE()},`;
        makeCSV += `${buffCSV.readInt16LE(4)}.${buffCSV.readInt8(6)},`;
        makeCSV += `${buffCSV.readInt16LE(7)}.${buffCSV.readInt8(9)},`;
        makeCSV += `${buffCSV.readInt16LE(10)}.${buffCSV.readInt8(12)},`;
        makeCSV += `${buffCSV.readInt16LE(13)}.${buffCSV.readInt8(15)},\n`;
        if (index == 32) {
          io.emit("status-stamp", {
            status: `${new Date(buffCSV.readUInt32LE() * 1000).toUTCString()}`
          });
          io.emit("live-data", {
            lc1: `${buffCSV.readInt16LE(4)}.${buffCSV.readInt8(6)}`,
            lc2: `${buffCSV.readInt16LE(7)}.${buffCSV.readInt8(9)}`, lc3: `${buffCSV.readInt16LE(10)}.${buffCSV.readInt8(12)}`,
            lc4: `${buffCSV.readInt16LE(13)}.${buffCSV.readInt8(15)}`
          });
        }
        index += 16;
      }
    }

    const date = new Date();
    let filename = `/${date.toJSON().slice(0, 10)}_${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}.csv`
    fs.appendFile(savePath + filename, makeCSV, (err) => {
      if (err) return console.log(err);
      // console.log("Saving Data");
    });
    console.log(makeCSV);
  } else if (req.body.port == 3) {
    console.log("it's status report");
    const batt = bufferObj.readUInt16BE();
    const sysTime = new Date(bufferObj.readUInt32BE(2)).toUTCString();
    const degF = bufferObj.readUInt8(6);
    let paramsData = `Batt: ${batt / 1000} V Sys Time: ${sysTime} Sys Temp: ${degF}`;

    io.emit("status-stamp", {
      status: paramsData
    });

    sendMail(paramsData);
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
  });
};

const degFahrenheit = (temp) => {
  return ((temp / 10) * 1.8 + 32).toFixed(2);
};

const sendTime = () => {
};

const sendMail = (emailMessage) => {
  let mailOptions = {
    from: "nodemailer@devusol.com",
    to: "flexmethods@gmail.com",
    subject: "Waverider Lives",
    text: emailMessage
  };

  let transporter = nodemailer.createTransport({
    host: "devusol.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_UN,
      pass: process.env.EMAIL_PW
    }
  });

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log("Error occurred. " + err.message);
      return process.exit(1);
    }
    console.log("Message sent: %s", mail.messageId);
  });
};

async function clearDownlink() {
  let buff = Buffer.from(clearHeliumDownlink);
  let base64data = buff.toString("base64");
  await axios
    .post(downlinkURL, {
      payload_raw: base64data,
      port: 16,
      confirmed: false
    })
    .then(function (response) {
      console.log(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
}