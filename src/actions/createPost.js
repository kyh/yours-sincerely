import Firebase from 'firebase/app';
import slugify from 'slugify';
import { prepareDocForCreate } from './helpers/firestoreHelpers';

const createPost = values => {
  const firstWords = values.content.replace(/(([^\s]+\s\s*){4})(.*)/, '');
  values.slug = slugify(firstWords, { lower: true });
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
