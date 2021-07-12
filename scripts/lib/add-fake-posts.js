const admin = require("firebase-admin");
const chalk = require("chalk");

const postData = require("../data/fake-posts.js");

// init firebase
const serviceAccount = require("./serviceAccountKey.dev.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = require("firebase-admin").firestore();

// add fake posts
console.log(chalk.blue(`Adding fake post data...`));
postData.map((post) => firestore.collection("posts").add(post));
console.log(chalk.green(`...added fake posts`));
