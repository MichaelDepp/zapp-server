const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin");
const cors = require("cors");
const _ = require("lodash");

var serviceAccount = require("./zapp-6df09-firebase-adminsdk-19bf6-cd5ef5515f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://zapp-6df09.firebaseio.com",
});

var db = admin.database();
// var userRef = db.ref("accounts");
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  db.ref("accounts").once("value", (snapshot) => {
    data = snapshot.val();
    res.json({ data });
  });
});

app.post("/", (req, res) => {
  try {
    db.ref("accounts").once("value", (snapshot) => {
      data = snapshot.val();
      const user = _.find(data, function (item) {
        if (
          item.email === req.body.email &&
          item.password.toString() === req.body.password
        ) {
          return item;
        }
      });
      if (user) {
        res.json({ message: "success", user: user.userid });
      } else {
        res.json({ message: "error" });
      }
    });
  } catch (e) {
    res.json({ message: "200" });
  }
  // console.log("enterrred");
  // console.log(req.body);
});

app.post("/getsent", (req, res) => {
  if (req.body.user) {
    try {
      db.ref("users/" + req.body.user + "/emails").once("value", (snapshot) => {
        allmessage = snapshot.val();
        sent = _.filter(allmessage, { currentLocation: "sent" });
        res.json({ sent: sent });
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({ message: "error" });
  }
});

app.post("/getinbox", (req, res) => {
  if (req.body.user) {
    try {
      db.ref("users/" + req.body.user + "/emails").once("value", (snapshot) => {
        allmessage = snapshot.val();
        inbox = _.filter(allmessage, { currentLocation: "inbox" });
        res.json({ inbox: inbox });
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({ message: "error" });
  }
});

app.post("/gettrash", (req, res) => {
  if (req.body.user) {
    try {
      db.ref("users/" + req.body.user + "/emails").once("value", (snapshot) => {
        allmessage = snapshot.val();
        trash = _.filter(allmessage, { currentLocation: "trash" });
        res.json({ trash: trash });
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({ message: "error" });
  }
});

app.post("/getprofile", (req, res) => {
  let profile, sent, inbox, trash;
  if (req.body.user) {
    try {
      db.ref("users/" + req.body.user + "/userinfo").once(
        "value",
        (snapshot) => {
          profile = snapshot.val();
        }
      );
    } catch (e) {
      console.log(e);
    }
    try {
      db.ref("users/" + req.body.user + "/emails").once("value", (snapshot) => {
        allmessage = snapshot.val();
        sent = _.filter(allmessage, { currentLocation: "sent" });
        inbox = _.filter(allmessage, { currentLocation: "inbox" });
        trash = _.filter(allmessage, { currentLocation: "trash" });
        res.json({
          profile: profile,
          sent: sent.length,
          inbox: inbox.length,
          trash: trash.length,
        });
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({ message: "error" });
  }
});

app.post("/getmail", (req, res) => {
  if (req.body.user) {
    try {
      db.ref("users/" + req.body.user + "/emails/" + req.body.slug).once(
        "value",
        (snapshot) => {
          data = snapshot.val();
          res.json({ message: data });
        }
      );
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({ message: "200" });
  }
});

app.listen(port, () => {
  console.log(`Zapp server is listening at http://localhost:${port}`);
});
