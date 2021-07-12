const admin = require("firebase-admin");
const Promise = require("bluebird");
const chalk = require("chalk");

// init firebase
const serviceAccount = require("./serviceAccountKey.dev.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const firestore = require("firebase-admin").firestore();

console.log(chalk.blue(`Making all post createdByDisplayName's UPPERCASE...`));

// if you're collection is big, you might want to paginate the query
// so you don't download the entire thing at once:
// https://firebase.google.com/docs/firestore/query-data/query-cursors
// TODO - show an example?
firestore
  .collection("posts")
  .get()
  .then((snap) => {
    // Bluebird Promises lets you limit promises running at once:
    // http://bluebirdjs.com/docs/api/promise.map.html
    return Promise.map(snap.docs, updatePost, { concurrency: 5 });
  })
  .then(() => {
    console.log(chalk.green(`✅ done!`));
  })
  .catch((error) => {
    console.log(chalk.red(`⚠️ migration error: `), error);
  });

const updatePost = (doc) => {
  console.log(`  migrating post ${doc.id}...`);
  return firestore.collection("posts").doc(doc.id).update({
    createdByDisplayName: doc.data().createdByDisplayName.toUpperCase(),
  });
};
