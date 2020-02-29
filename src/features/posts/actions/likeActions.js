import firebase from 'firebase/app';
import { prepareDocForCreate } from 'util/firestoreUtil';

export const getUserLikeQuery = (postId = 1, userId = 1) => {
  return firebase
    .firestore()
    .collection('postLikes')
    .where('postId', '==', postId)
    .where('createdBy', '==', userId);
};

export const likePost = postId => {
  const like = prepareDocForCreate({
    postId
  });

  return firebase
    .firestore()
    .collection('postLikes')
    .add(like);
};

export const unlikePost = userLikeId => {
  return firebase
    .firestore()
    .collection('postLikes')
    .doc(userLikeId)
    .delete();
};
