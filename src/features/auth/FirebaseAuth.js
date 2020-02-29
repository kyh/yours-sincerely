// wrapper for Firebase Authentication
// similar API to react-firestore, but instead of returning a collection or document,
// it returns the logged in user (or null if not logged in) along with loading state and errors

import firebase from 'firebase/app';
import { useState, useEffect, useRef } from 'react';

export const FirebaseAuth = ({ children }) => {
  const ref = useRef({});
  const [state, setState] = useState({
    isLoading: true,
    error: null,
    auth: null
  });

  useEffect(() => {
    ref.current.unsubscribe = firebase
      .auth()
      .onAuthStateChanged(handleAuth, handleError);

    return () => {
      if (ref.current.unsubscribe) {
        ref.current.unsubscribe();
      }
    };
  }, []);

  const handleAuth = auth => {
    setState({
      isLoading: false,
      auth,
      error: null
    });
  };

  const handleError = error => {
    setState({
      isLoading: false,
      auth: null,
      error
    });
  };

  return children(state);
};
