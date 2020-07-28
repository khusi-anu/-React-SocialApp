const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const firebaseConfig = {
  apiKey: "AIzaSyCtP4OIJZb0oa7GlKkE7wsZStKxiFDSgaw",
  authDomain: "socialapp-49467.firebaseapp.com",
  databaseURL: "https://socialapp-49467.firebaseio.com",
  projectId: "socialapp-49467",
  storageBucket: "socialapp-49467.appspot.com",
  messagingSenderId: "605389380863",
  appId: "1:605389380863:web:dd2d3db2bd180f07f500ca",
  measurementId: "G-WZTTJ2JPB3",
};

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
// Dummy code to understand the structure (Hello World for firebase app)
/*
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
*/
const express = require("express");
const app = express();

const firebase = require("firebase");
firebase.initializeApp(firebaseConfig);

// can use alternatively
const db = firebase.firestore();

// Routing from express
app.get("/Posts", (req, res) => {
  admin
    .firestore()
    .collection("Posts")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let posts = [];
      data.forEach((doc) => {
        posts.push({
          ...doc.data(),
          postId: doc.id,
        });
      });
      return res.json(posts);
    })
    .catch((err) => console.error(err));
});

app.post("/create", (req, res) => {
  admin
    .firestore()
    .collection("Posts")
    .add({
      body: req.body.body,
      createdAt: new Date().toISOString(),
      userHandle: req.body.userHandle,
    })
    .then((doc) => {
      res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ error: "something went wrong" });
      console.log(err);
    });
});

const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  else return false;
};

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  else return false;
};

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  /*firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then((data) => {
      return res
        .status(201)
        .json({ message: `user ${data.user.uid} signed up successfully` });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
});
*/
  //validate data
  //doc reference is returned

  let errors = {};

  if (isEmpty(newUser.email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(newUser.email)) {
    errors.email = "Must be a valid email address";
  }

  if (isEmpty(newUser.password)) errors.password = "Must not be empty";

  if (newUser.password !== newUser.confirmPassword)
    errors.confirmPassword = "Passwords must match";

  if (isEmpty(newUser.handle)) errors.handle = "Must not be empty";
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  // let token, userId;
  var docRef = db.collection("users").doc(`${newUser.handle}`);

  docRef
    .get()
    .then((doc) => {
      //then block returns always

      if (doc.exists) {
        return res.status(400).json({ handle: "this handle is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      //return userId;
      return data.user.getIdToken();
    })
    .then((idToken) => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      db.collection("users").doc(`${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      //if (err.code === "auth/email-already-in-use") {
      // return res.status(400).json({ email: "Email is already in use" });
      //} else {
      return res.status(500).json({ error: err.code });
      //}
    });
});

app.post("/login", (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  let errors = {};
  if (isEmpty(user.email)) errors.email = "Must not be empty";

  if (isEmpty(user.password)) errors.password = "Must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.log(err);
      if (err.code === "auth/wrong-password")
        return res.status(403).json({ general: "wrong credentials" });

      return res.status(500).json({ error: err.code });
    });
});

exports.api = functions.https.onRequest(app);
