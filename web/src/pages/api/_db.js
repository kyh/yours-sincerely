const firebaseAdmin = require("./_firebase");

const firestore = firebaseAdmin.firestore();

const updateUser = (uid, data) => {
  return firestore.collection("users").doc(uid).update(data);
};

const getUser = (uid) => {
  return firestore.collection("users").doc(uid).get().then(format);
};

const getUserByCustomerId = (customerId) => {
  return firestore
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .get()
    .then(format)
    .then((docs) => (docs ? docs[0] : null));
};

const updateUserByCustomerId = (customerId, data) => {
  return getUserByCustomerId(customerId).then((user) => {
    return updateUser(user.id, data);
  });
};

const format = (response) => {
  if (response.docs) {
    return response.docs.map(getDoc);
  } else {
    return getDoc(response);
  }
};

const getDoc = (doc) => (doc.exists ? { id: doc.id, ...doc.data() } : null);

module.exports = {
  updateUser,
  getUser,
  getUserByCustomerId,
  updateUserByCustomerId,
};
