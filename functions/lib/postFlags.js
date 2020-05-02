const admin = require("firebase-admin");

// update _flagged on a post
exports.updatePostFlag = (change, context) => {
  const data = change.after.exists ? change.after.data() : change.before.data();
  const { postId, createdBy } = data;

  return Promise.all([
    admin.firestore().collection("posts").doc(postId).update({
      _flagged: true,
    }),
    admin.auth().updateUser(createdBy, {
      _flagged: true,
    }),
  ]);
};
