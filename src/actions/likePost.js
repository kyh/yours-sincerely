import Firebase from 'firebase/app';
import { prepareDocForCreate } from './helpers/firestoreHelpers';

const likePost = post => {
  const like = prepareDocForCreate({
    postId: post.id
  });

  return Firebase.firestore()
    .collection('postLikes')
    .add(like);
};

export default likePost;
