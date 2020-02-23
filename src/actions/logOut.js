import Firebase from 'firebase/app';

const logOut = () => {
  return Firebase.auth().signOut();
};

export default logOut;
