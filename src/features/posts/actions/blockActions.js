import firebase from "firebase/app";
import { prepareDocForCreate } from "util/firestoreUtil";

export const getBlockedUsersQuery = () => {
  const user = firebase.auth().currentUser;

  return firebase
    .firestore()
    .collection("blockUser")
    .where("createdBy", "==", user ? user.uid : 1);
};

export const blockUser = (blockedUserId) => {
  const block = prepareDocForCreate({
    blockedUser: blockedUserId,
  });

  return firebase.firestore().collection("blockUser").add(block);
};

export const unblockUser = (block) => {
  return firebase.firestore().collection("blockUser").doc(block).delete();
};
