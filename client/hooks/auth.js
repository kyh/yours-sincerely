import { useState, useEffect } from 'react';
import firebase from '@utils/firebase';

export const AUTH_STATES = {
  loading: 'loading',
  in: 'in',
  out: 'out',
};

export function useAuth() {
  const [authState, setAuthState] = useState({
    status: AUTH_STATES.loading,
    user: null,
    token: null,
  });

  useEffect(() => {
    return firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        const idTokenResult = await user.getIdTokenResult();
        const hasuraClaim =
          idTokenResult.claims['https://hasura.io/jwt/claims'];

        if (hasuraClaim) {
          setAuthState({ status: AUTH_STATES.in, user, token });
        } else {
          // Check if refresh is required.
          const metadataRef = firebase
            .database()
            .ref(`metadata/${user.uid}/refreshTime`);

          metadataRef.on('value', async () => {
            // Force refresh to pick up the latest custom claims changes.
            const refreshedToken = await user.getIdToken(true);
            setAuthState({
              status: AUTH_STATES.in,
              user,
              token: refreshedToken,
            });
          });
        }
      } else {
        setAuthState({ status: AUTH_STATES.out, user: null, token: null });
      }
    });
  }, []);

  return [authState, setAuthState];
}
