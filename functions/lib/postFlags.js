const admin = require("firebase-admin");

// update _flagged on a post
exports.updatePostFlag = (change, context) => {
  const postId = change.after.exists
    ? change.after.data().postId
    : change.before.data().postId;

  return admin.firestore().collection("posts").doc(postId).update({
    _flagged: true,
  });
};
