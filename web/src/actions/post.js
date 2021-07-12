import { subDays } from "date-fns";
import {
  firebase,
  firestore,
  useQuery,
  prepareDocForCreate,
  prepareDocForUpdate,
} from "util/db";
import { useUserBlocks } from "actions/user";

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

export const usePosts = () => {
  const currentUser = firebase.auth().currentUser;
  const uid = currentUser && currentUser.uid;

  const postsQuery = useQuery(
    firestore
      .collection("posts")
      .where("createdAt", ">=", expiry)
      .orderBy("createdAt", "desc")
  );

  const { status: userBlockStatus, dataMap } = useUserBlocks(uid);

  const isLoading = currentUser
    ? postsQuery.status === "loading" || userBlockStatus === "loading"
    : postsQuery.status === "loading";

  const postsData = postsQuery.data
    ? postsQuery.data.filter((p) => !p._flagged && !dataMap[p.createdBy])
    : [];

  return {
    status: isLoading ? "loading" : "success",
    data: postsData,
    error: postsQuery.error,
  };
};

export const usePost = (postId) => {
  return useQuery(postId && firestore.collection("posts").doc(postId));
};

export const createPost = (post) => {
  post._likeCount = 0;
  post._flagged = false;
  return firestore
    .collection("posts")
    .add(prepareDocForCreate(post))
    .catch((error) => {
      alert(`Whoops, couldn't create the post: ${error.message}`);
    });
};

export const updatePost = (postId, post) => {
  return firestore
    .collection("posts")
    .doc(postId)
    .update(prepareDocForUpdate(post))
    .catch((error) => {
      alert(`Whoops, couldn't edit the post: ${error.message}`);
    });
};

export const deletePost = (postId) => {
  return firestore
    .collection("posts")
    .doc(postId)
    .delete()
    .catch((error) => {
      alert(`Whoops, couldn't delete the post: ${error.message}`);
    });
};

// Flagging a Post
export const flagPost = (postId) => {
  const flag = prepareDocForCreate({ postId });
  return firestore.collection("postFlags").add(flag);
};

export const unflagPost = (flagId) => {
  return firestore.collection("postFlags").doc(flagId).delete();
};

// Liking a Post
export const usePostLikes = (uid) => {
  const postLikesQuery = useQuery(
    uid && firestore.collection("postLikes").where("createdBy", "==", uid)
  );

  const dataMap = postLikesQuery.data
    ? postLikesQuery.data.reduce((map, l) => {
        map[l.postId] = l.id;
        return map;
      }, {})
    : {};

  return { status: postLikesQuery.status, dataMap };
};

export const likePost = (postId) => {
  const like = prepareDocForCreate({ postId });
  return firestore.collection("postLikes").add(like);
};

export const unlikePost = (likeId) => {
  return firestore.collection("postLikes").doc(likeId).delete();
};
