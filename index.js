const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin");
const cors = require("cors");
const _ = require("lodash");

var serviceAccount = require("D:/Michael/Documents/Solo Projects/Zapp/server/zapp-6df09-firebase-adminsdk-19bf6-cd5ef5515f.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://zapp-6df09.firebaseio.com",
});

var db = admin.database();
// var userRef = db.ref("accounts");
app.use(cors());
app.use(express.json());

let currentUser, profile;
let sent, inbox, trash, allmessage;

const sortMessage = (msg) => {
  sent = _.filter(msg, { currentLocation: "sent" });
  inbox = _.filter(msg, { currentLocation: "inbox" });
  trash = _.filter(msg, { currentLocation: "trash" });
};

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
        currentUser = user.userid;
        try {
          db.ref("users/" + currentUser + "/emails").once(
            "value",
            (snapshot) => {
              emails = snapshot.val();
              sortMessage(emails);
            }
          );
        } catch (e) {
          console.log(e);
        }
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

app.get("/getsent", (req, res) => {
  try {
    db.ref("users/" + currentUser + "/emails").once("value", (snapshot) => {
      allmessage = snapshot.val();
      sent = _.filter(allmessage, { currentLocation: "sent" });
      res.json({ sent: sent });
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/getinbox", (req, res) => {
  try {
    db.ref("users/" + currentUser + "/emails").once("value", (snapshot) => {
      allmessage = snapshot.val();
      inbox = _.filter(allmessage, { currentLocation: "inbox" });
      res.json({ inbox: inbox });
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/gettrash", (req, res) => {
  try {
    db.ref("users/" + currentUser + "/emails").once("value", (snapshot) => {
      allmessage = snapshot.val();
      trash = _.filter(allmessage, { currentLocation: "trash" });
      res.json({ trash: trash });
    });
  } catch (e) {
    console.log(e);
  }
});

app.get("/getprofile", (req, res) => {
  try {
    db.ref("users/" + currentUser + "/userinfo").once("value", (snapshot) => {
      profile = snapshot.val();
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
});

app.post("/getmail", (req, res) => {
  console.log(req.body);
  try {
    db.ref("users/" + currentUser + "/emails/" + req.body.slug).once(
      "value",
      (snapshot) => {
        data = snapshot.val();
        res.json({ message: data });
      }
    );
  } catch (e) {
    res.json({ message: "200" });
  }
  // console.log("enterrred");
  // console.log(req.body);
});

app.listen(port, () => {
  console.log(`Zapp server is listening at http://localhost:${port}`);
});
