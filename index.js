const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const admin = require("firebase-admin");
const cors = require("cors");
const shortid = require("shortid");
const _ = require("lodash");
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const storage = multer.diskStorage({
  // notice you are calling the multer.diskStorage() method here, not multer()
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    let exttype;
    if (file.mimetype === "image/jpeg") {
      exttype = ".jpg";
    } else if (file.mimetype === "image/png") {
      exttype = ".png";
    } else if (file.mimetype === "application/zip") {
      exttype = ".zip";
    } else if (file.mimetype === "image/webp") {
      exttype = ".webp";
    } else if (file.mimetype === "text/plain") {
      exttype = ".txt";
    } else if (file.mimetype === "application/x-tar") {
      exttype = ".tar";
    } else if (file.mimetype === "application/vnd.rar") {
      exttype = ".rar";
    } else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      exttype = ".pptx";
    } else if (file.mimetype === "application/vnd.ms-powerpoint") {
      exttype = ".ppt";
    } else if (file.mimetype === "application/pdf") {
      exttype = ".pdf";
    } else if (file.mimetype === "application/x-zip-compressed") {
      exttype = ".zip";
    } else if (file.mimetype === "application/msword") {
      exttype = ".doc";
    } else if (file.mimetype === "video/mpeg") {
      exttype = ".mpeg";
    } else if (
      file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      exttype = ".docx";
    } else if (file.mimetype === "audio/mpeg") {
      exttype = ".mp3";
    } else {
      exttype = "";
    }

    cb(null, file.fieldname + "-" + Date.now() + exttype);
  },
});
const upload = multer();
var serviceAccount = require("./zapp-6df09-firebase-adminsdk-19bf6-cd5ef5515f.json");
const { reject } = require("lodash");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://zapp-6df09.firebaseio.com",
});

const fireBstorage = new Storage({
  projectId: "zapp-6df09",
  keyFilename: "./zapp-6df09-firebase-adminsdk-19bf6-cd5ef5515f.json",
});

const bucket = fireBstorage.bucket("zapp-6df09.appspot.com");

var db = admin.database();
var expiryDate = new Date(Date.now() + 3600000 * 24 * 7);
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

  try {
    db.ref("users/" + req.body.user + "/emails/" + req.body.slug).update({
      read: "true",
    });
    console.log("moved");
  } catch (e) {
    console.log(e);
    console.log("fail");
  }
});

/*=================================== SIGN UP SECTION OF ZAPPP ===================================*/

app.post("/emailidcheck", (req, res) => {
  console.log(
    "============received email to check ==============",
    req.body.email
  );
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
    timestamp: new Date(),
    title: "Welcome to Zapp " + req.body.data.fname,
  };

  const alert1 = {
    from: "Zapp Team",
    message: "1 message unread",
    read: false,
    timestamp: new Date(),
  };

  let register = new Promise((resolve, reject) => {
    try {
      db.ref("accounts/" + ("registry" + req.body.data.id)).set({
        email: req.body.data.email,
        password: req.body.data.password,
        fullname: req.body.data.fname + " " + req.body.data.lname,
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

/*=================================== Email Compose SECTION OF ZAPPP ===================================*/

app.post("/composemail", upload.single("file"), (req, res) => {
  const emailId = "emailooo" + shortid.generate();
  let fileUrl = new Promise((resolve, reject) => {
    console.log("fileee passedddd ", req.file);
    if (!req.file) {
      reject(null);
    }

    let exttype;
    if (req.file.mimetype === "image/jpeg") {
      exttype = "jpg";
    } else if (req.file.mimetype === "image/png") {
      exttype = "png";
    } else if (req.file.mimetype === "application/zip") {
      exttype = "zip";
    } else if (req.file.mimetype === "image/webp") {
      exttype = "webp";
    } else if (req.file.mimetype === "text/plain") {
      exttype = "txt";
    } else if (req.file.mimetype === "application/x-tar") {
      exttype = "tar";
    } else if (req.file.mimetype === "application/vnd.rar") {
      exttype = "rar";
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      exttype = "pptx";
    } else if (req.file.mimetype === "application/vnd.ms-powerpoint") {
      exttype = "ppt";
    } else if (req.file.mimetype === "application/pdf") {
      exttype = "pdf";
    } else if (req.file.mimetype === "application/x-zip-compressed") {
      exttype = "zip";
    } else if (req.file.mimetype === "application/msword") {
      exttype = "doc";
    } else if (req.file.mimetype === "video/mpeg") {
      exttype = "mpeg";
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      exttype = "docx";
    } else if (req.file.mimetype === "audio/mpeg") {
      exttype = "mp3";
    } else {
      exttype = "";
    }

    let newFileName = `${req.file.originalname.replace(
      / /g,
      "_"
    )}_${Date.now()}.${exttype}`;

    let fileUpload = bucket.file(newFileName);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (error) => {
      next(error);
    });

    blobStream.on("finish", () => {
      const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
      resolve(url);
    });

    blobStream.end(req.file.buffer);
  });

  fileUrl
    .then((url) => {
      console.log("fileeee isss passeddddd", url);
      let getName = new Promise((resolve, reject) => {
        try {
          db.ref("accounts").once("value", (snapshot) => {
            data = snapshot.val();
            const receiverN = _.find(data, function (item) {
              if (item.email === req.body.receiver) {
                return item;
              }
            });
            const senderN = _.find(data, function (item) {
              if (item.email === req.body.sender + "@zapp.com") {
                return item;
              }
            });
            resolve({
              senderName: senderN.fullname,
              receiverName: receiverN.fullname,
              receiverId: receiverN.userid,
            });
          });
        } catch (e) {
          console.log(e);
          reject({
            senderName: "null",
            receiverName: "null",
          });
        }
      });

      getName
        .then((names) => {
          console.log(names.receiverId);
          console.log("users/" + names.receiverId + "/emails/" + emailId);
          // sending email to the receiver
          try {
            console.log("users/" + names.receiverId + "/emails/" + emailId);
            db.ref("users/" + names.receiverId + "/emails/" + emailId).set({
              currentLocation: "inbox",
              id: emailId,
              initialLocation: "inbox",
              message: req.body.message,
              read: false,
              receiverEmail: req.body.receiver,
              receiverName: names.receiverName,
              senderEmail: req.body.sender + "@zapp.com",
              senderName: names.senderName,
              timestamp: req.body.timestamp,
              title: req.body.title,
              file: url,
            });
            console.log("receiver copy success");
          } catch (e) {
            console.log(e);
            console.log("receiver copy faileddd");
          }

          //saving copy for the sender
          try {
            db.ref("users/" + req.body.sender + "/emails/" + emailId).set({
              currentLocation: "sent",
              id: emailId,
              initialLocation: "sent",
              message: req.body.message,
              read: true,
              receiverEmail: req.body.receiver,
              receiverName: names.receiverName,
              senderEmail: req.body.sender + "@zapp.com",
              senderName: names.senderName,
              timestamp: req.body.timestamp,
              title: req.body.title,
              file: url,
            });
            console.log("successss sender");
            res.json({ message: "sent" });
          } catch (e) {
            console.log("faileddd sender");
            console.log("===========>", +e);
            res.json({ message: "failed" });
          }
        })
        .catch((message) => {
          console.log("======bottom=====>", +message);
          res.json({ message });
        });
    })
    .catch((url) => {
      console.log("nooooo fileee is passeddd");
      let getName = new Promise((resolve, reject) => {
        try {
          db.ref("accounts").once("value", (snapshot) => {
            data = snapshot.val();
            const receiverN = _.find(data, function (item) {
              if (item.email === req.body.receiver) {
                return item;
              }
            });
            const senderN = _.find(data, function (item) {
              if (item.email === req.body.sender + "@zapp.com") {
                return item;
              }
            });
            resolve({
              senderName: senderN.fullname,
              receiverName: receiverN.fullname,
              receiverId: receiverN.userid,
            });
          });
        } catch (e) {
          console.log(e);
          reject({
            senderName: "null",
            receiverName: "null",
          });
        }
      });

      getName
        .then((names) => {
          console.log(names.receiverId);
          console.log("users/" + names.receiverId + "/emails/" + emailId);
          // sending email to the receiver
          try {
            console.log("users/" + names.receiverId + "/emails/" + emailId);
            db.ref("users/" + names.receiverId + "/emails/" + emailId).set({
              currentLocation: "inbox",
              id: emailId,
              initialLocation: "inbox",
              message: req.body.message,
              read: false,
              receiverEmail: req.body.receiver,
              receiverName: names.receiverName,
              senderEmail: req.body.sender + "@zapp.com",
              senderName: names.senderName,
              timestamp: req.body.timestamp,
              title: req.body.title,
            });
            console.log("receiver copy success");
          } catch (e) {
            console.log(e);
            console.log("receiver copy faileddd");
          }

          //saving copy for the sender
          try {
            db.ref("users/" + req.body.sender + "/emails/" + emailId).set({
              currentLocation: "sent",
              id: emailId,
              initialLocation: "sent",
              message: req.body.message,
              read: true,
              receiverEmail: req.body.receiver,
              receiverName: names.receiverName,
              senderEmail: req.body.sender + "@zapp.com",
              senderName: names.senderName,
              timestamp: req.body.timestamp,
              title: req.body.title,
            });
            console.log("successss sender");
            res.json({ message: "sent" });
          } catch (e) {
            console.log("faileddd sender");
            console.log("===========>", +e);
            res.json({ message: "failed" });
          }
        })
        .catch((message) => {
          console.log("======bottom=====>", +message);
          res.json({ message });
        });
    });
});

/*=================================== Move To Trash SECTION OF ZAPPP ===================================*/

app.post("/trashrestore", (req, res) => {
  try {
    db.ref("users/" + req.body.userid + "/emails/" + req.body.emailid).update({
      currentLocation: req.body.location,
    });
    res.json({ message: "moved" });
  } catch (e) {
    console.log(e);
    res.json({ message: "fail" });
  }
});

app.post("/delete", (req, res) => {
  console.log(req.body);
  try {
    let emaild = db.ref(
      "users/" + req.body.userid + "/emails/" + req.body.emailid
    );
    emaild.remove();
    res.json({ message: "deleted" });
    console.log("deletedddddddd");
  } catch (e) {
    console.log(e);
    console.log("failllllllllll");
    res.json({ message: "fail" });
  }
});

app.listen(port, () => {
  console.log(`Zapp server is listening at http://localhost:${port}`);
});
