import firebase from "firebase/app";
import { prepareDocForCreate, prepareDocForUpdate } from "util/firestoreUtil";

export const getCommentsListQuery = (postId) => {
  return firebase
    .firestore()
    .collection("comments")
    .where("postId", "==", postId)
    .orderBy("createdAt", "desc");
};

export const createComment = (values) => {
  return firebase
    .firestore()
    .collection("comments")
    .add(prepareDocForCreate(values))
    .then(() => values)
    .catch((error) => {
      alert(`Whoops, couldn't create the comment: ${error.message}`);
    });
};

export const updateComment = (commentId, values) => {
  return firebase
    .firestore()
    .collection("comments")
    .doc(commentId)
    .update(prepareDocForUpdate(values))
    .catch((error) => {
      alert(`Whoops, couldn't edit the comment: ${error.message}`);
    });
};

export const deleteComment = (commentId) => {
  return firebase
    .firestore()
    .collection("comments")
    .doc(commentId)
    .delete()
    .catch((error) => {
      alert(`Whoops, couldn't delete the comment: ${error.message}`);
    });
};
