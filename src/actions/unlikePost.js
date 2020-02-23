import Firebase from 'firebase/app';

const unlikePost = userLike => {
  return Firebase.firestore()
    .collection('postLikes')
    .doc(userLike.id)
    .delete();
};

export default unlikePost;
