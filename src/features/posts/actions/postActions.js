import { subDays } from "date-fns";
import firebase from "firebase/app";
import { prepareDocForCreate, prepareDocForUpdate } from "util/firestoreUtil";

export const POST_EXPIRY_DAYS_AGO = 21;

const getExpiry = () => {
  return firebase.firestore.Timestamp.fromDate(
    subDays(new Date(), POST_EXPIRY_DAYS_AGO)
  );
};

let expiry = getExpiry();
setInterval(() => {
  expiry = getExpiry();
}, 1000 * 60 * 60);

export const getPostListQuery = () => {
  return firebase
    .firestore()
    .collection("posts")
    .where("createdAt", ">=", expiry)
    .orderBy("createdAt", "desc");
};

export const getPostQuery = (postId) => {
  return firebase.firestore().doc(`posts/${postId}`);
};

export const createPost = (values) => {
  values._likeCount = 0;
  values._flagged = false;

  return firebase
    .firestore()
    .collection("posts")
    .add(prepareDocForCreate(values))
    .then(() => values)
    .catch((error) => {
      alert(`Whoops, couldn't create the post: ${error.message}`);
    });
};

export const updatePost = (postId, values) => {
  return firebase
    .firestore()
    .collection("posts")
    .doc(postId)
    .update(prepareDocForUpdate(values))
    .catch((error) => {
      alert(`Whoops, couldn't edit the post: ${error.message}`);
    });
};

export const deletePost = (post) => {
  return firebase
    .firestore()
    .collection("posts")
    .doc(post.id)
    .delete()
    .catch((error) => {
      alert(`Whoops, couldn't delete the post: ${error.message}`);
    });
};

export const flagPost = (postId) => {
  const flag = prepareDocForCreate({
    postId,
  });

  return firebase.firestore().collection("postFlags").add(flag);
};
