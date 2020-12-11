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

/*=================================== SIGN UP SECTION OF ZAPPP ===================================*/

app.post("/emailidcheck", (req, res) => {
  if (req.body.email) {
    try {
      db.ref("accounts").once("value", (snapshot) => {
        data = snapshot.val();
        const user = _.find(data, function (item) {
          if (item.email === req.body.email) {
            return item;
          }
        });
        if (user) {
          res.json({ message: "exists" });
        } else {
          res.json({ message: "unique" });
        }
      });
    } catch (e) {
      console.log(e);
    }
  } else {
    res.json({ message: "200" });
  }
});

app.post("/registeruser", (req, res) => {
  console.log(req.body.data);

  const welcomeEmail = {
    currentLocation: "inbox",
    id: "email1",
    initialLocation: "inbox",
    message:
      "Welcome to Zapp Email Service. We are the world first email service specially tailored for blind people.",
    read: false,
    receiverEmail: req.body.data.email,
    receiverName: req.body.data.fname + " " + req.body.data.lname,
    senderEmail: "team@zapp.com",
    senderName: "Zapp Official",
    timestamp: "11-12-2020",
    title: "Welcome to Zapp " + req.body.data.fname,
  };

  const alert1 = {
    from: "Zapp Team",
    message: "1 message unread",
    read: false,
    timestamp: "11-12-2020",
  };

  let register = new Promise((resolve, reject) => {
    try {
      db.ref("accounts/" + ("registry" + req.body.data.id)).set({
        email: req.body.data.email,
        password: req.body.data.password,
        userid: req.body.data.id,
      });
      resolve("register");
    } catch (e) {
      reject("not register");
    }
  });

  register
    .then((message) => {
      if (message === "register") {
        try {
          db.ref("users/" + req.body.data.id).set({
            emails: {
              email1: welcomeEmail,
            },
            notification: {
              alert1: alert1,
            },
            userinfo: {
              age: req.body.data.age,
              fname: req.body.data.fname,
              lname: req.body.data.lname,
              location: req.body.data.city + ", " + req.body.data.country,
              phone: req.body.data.phone,
            },
          });
          res.json({ message: "complete" });
        } catch (e) {
          res.json({ message: "failed" });
        }
      }
    })
    .catch((message) => {
      res.json({ message });
    });
});

app.listen(port, () => {
  console.log(`Zapp server is listening at http://localhost:${port}`);
});
