import Firebase from 'firebase/app';
import { prepareDocForCreate, prepareDocForUpdate } from 'util/firestoreUtil';

export const createPost = values => {
  values._likeCount = 0;

  return Firebase.firestore()
    .collection('posts')
    .add(prepareDocForCreate(values))
    .then(() => values)
    .catch(error => {
      alert(`Whoops, couldn't create the post: ${error.message}`);
    });
};

export const updatePost = (postId, values) => {
  return Firebase.firestore()
    .collection('posts')
    .doc(postId)
    .update(prepareDocForUpdate(values))
    .catch(error => {
      alert(`Whoops, couldn't edit the post: ${error.message}`);
    });
};

export const deletePost = post => {
  return Firebase.firestore()
    .collection('posts')
    .doc(post.id)
    .delete()
    .catch(error => {
      alert(`Whoops, couldn't delete the post: ${error.message}`);
    });
};