import Firebase from 'firebase/app';
import { prepareDocForCreate } from './helpers/firestoreHelpers';

const createPost = values => {
  values._likeCount = 0;

  return Firebase.firestore()
    .collection('posts')
    .add(prepareDocForCreate(values))
    .then(() => values)
    .catch(error => {
      alert(`Whoops, couldn't create the post: ${error.message}`);
    });
};

export default createPost;
