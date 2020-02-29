import firebase from 'firebase/app';
import { prepareDocForCreate } from 'util/firestoreUtil';

export const likePost = post => {
  const like = prepareDocForCreate({
    postId: post.id
  });

  return firebase
    .firestore()
    .collection('postLikes')
    .add(like);
};

export const unlikePost = userLike => {
  return firebase
    .firestore()
    .collection('postLikes')
    .doc(userLike.id)
    .delete();
};
