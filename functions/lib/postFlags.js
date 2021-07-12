const admin = require("firebase-admin");

// update _flagged on a post
exports.updatePostFlag = (change, context) => {
  const data = change.after.exists ? change.after.data() : change.before.data();
  const { postId, createdBy } = data;

  return Promise.all([
    admin.firestore().collection("posts").doc(postId).update({
      _flagged: true,
    }),
    admin.firestore().collection("users").doc(createdBy).update({
      flagged: true,
    }),
    // we'll want to deprecate custom user claims.
    admin.auth().setCustomUserClaims(createdBy, { flagged: true }),
  ]);
};
