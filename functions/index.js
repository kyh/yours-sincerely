const admin = require("firebase-admin");
const functions = require("firebase-functions");

admin.initializeApp(functions.config().firebase);

// const search = require("./lib/search");
const postFlags = require("./lib/postFlags");
const postLikes = require("./lib/postLikes");

// exports.updatePostInSearchIndex = functions.firestore
//   .document("posts/{postId}")
//   .onWrite(search.updatePostInSearchIndex);

exports.updatePostLikeCount = functions.firestore
  .document("postLikes/{postLikeId}")
  .onWrite(postLikes.updatePostLikeCount);

exports.updatePostFlag = functions.firestore
  .document("postFlags/{postFlagId}")
  .onWrite(postFlags.updatePostFlag);
