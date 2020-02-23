import Firebase from 'firebase/app';
import { prepareDocForUpdate } from './helpers/firestoreHelpers';

const updatePost = (postId, values) => {
  return Firebase.firestore()
    .collection('posts')
    .doc(postId)
    .update(prepareDocForUpdate(values))
    .catch(error => {
      alert(`Whoops, couldn't edit the post: ${error.message}`);
    });
};

export default updatePost;
