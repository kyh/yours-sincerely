import { useState, useEffect } from 'react';
import firebase from '@utils/firebase';

export const AUTH_STATES = {
  loading: 'loading',
  in: 'in',
  out: 'out',
};

function saveToLocalStorage(user, token) {
  if (user && token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }
}

export function useAuth() {
  const [authState, setAuthState] = useState({
    status: AUTH_STATES.loading,
    user: null,
    token: null,
  });

  const setAuthStateAndSave = (as) => {
    setAuthState(as);
    saveToLocalStorage(as.user, as.token);
  };

  useEffect(() => {
    return firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const idTokenResult = await user.getIdTokenResult();
        const hasuraClaim =
          idTokenResult.claims['https://hasura.io/jwt/claims'];

        if (hasuraClaim) {
          setAuthStateAndSave({ status: AUTH_STATES.in, user, token });
        } else {
          // Check if refresh is required.
          const metadataRef = firebase
            .database()
            .ref(`metadata/${user.uid}/refreshTime`);

          metadataRef.on('value', async () => {
            // Force refresh to pick up the latest custom claims changes.
            const refreshedToken = await user.getIdToken(true);
            setAuthStateAndSave({
              status: AUTH_STATES.in,
              user,
              token: refreshedToken,
            });
          });
        }
      } else {
        setAuthStateAndSave({
          status: AUTH_STATES.out,
          user: null,
          token: null,
        });
      }
    });
  }, []);

  return [authState, setAuthState];
}
