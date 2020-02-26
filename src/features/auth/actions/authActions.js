import Firebase from 'firebase/app';

export const loginTypes = {
  anonymous: 'anonymous',
  google: 'google'
};

const getProvider = {
  [loginTypes.anonymous]: () => null,
  [loginTypes.google]: () => new Firebase.auth.GoogleAuthProvider()
};

export const login = loginType => {
  const provider = getProvider[loginType]();
  if (provider) return Firebase.auth().signInWithRedirect(provider);
  return Firebase.auth().signInAnonymously();
};

export const logout = () => {
  return Firebase.auth().signOut();
};
