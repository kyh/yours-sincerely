import Firebase from 'firebase/app';
import { prepareDocForCreate } from 'util/firestoreUtil';

export const likePost = post => {
  const like = prepareDocForCreate({
    postId: post.id
  });

  return Firebase.firestore()
    .collection('postLikes')
    .add(like);
};

export const unlikePost = userLike => {
  return Firebase.firestore()
    .collection('postLikes')
    .doc(userLike.id)
    .delete();
};
