import { useState, useEffect, useMemo, useContext, createContext } from "react";
import router from "next/router";
import queryString from "query-string";
import { firebase, firestore, useQuery } from "util/db";
import { getFriendlyPlanId } from "util/prices";
import analytics from "util/analytics";

// Whether to merge extra user data from database into auth.user
const MERGE_DB_USER = false;
// Whether to send email verification on signup
const EMAIL_VERIFICATION = false;
// Whether to connect analytics session to user.uid
const ANALYTICS_IDENTIFY = false;

export const useUser = (uid) => {
  return useQuery(uid && firestore.collection("users").doc(uid));
};

export const upsertUser = (uid, data) => {
  return firestore
    .collection("users")
    .doc(uid)
    .set({ ...data, uid }, { merge: true });
};

const authContext = createContext();

// Context Provider component that wraps your app and makes auth object
// available to any child component that calls the useAuth() hook.
export const AuthProvider = ({ children }) => {
  const auth = useAuthProvider();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
};

// Hook that enables any component to subscribe to auth state
export const useAuth = () => {
  return useContext(authContext);
};

const useAuthProvider = () => {
  // Store auth user object
  const [user, setUser] = useState(null);

  // Format final user object and merge extra data from database
  const finalUser = usePrepareUser(user);

  // Connect analytics session to user
  useIdentifyUser(finalUser);

  // Handle response from authentication functions
  const handleAuth = async (response) => {
    const { user, additionalUserInfo } = response;

    // Ensure Firebase is actually ready before we continue
    await waitForFirebase();

    // Create the user in the database if they are new
    if (additionalUserInfo.isNewUser) {
      await upsertUser(user.uid, { email: user.email });

      // Send email verification if enabled
      if (EMAIL_VERIFICATION) {
        firebase.auth().currentUser.sendEmailVerification();
      }
    }

    // Update user in state
    setUser(user);
    return user;
  };

  const getCurrentUserClaim = async () => {
    const currentUser = firebase.auth().currentUser;
    await currentUser.getIdToken(true);
    return currentUser.getIdTokenResult();
  };

  const signup = (email, password) => {
    return firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(handleAuth);
  };

  const signin = (email, password) => {
    return firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(handleAuth);
  };

  const signinWithProvider = (name) => {
    if (!name) return firebase.auth().signInAnonymously().then(handleAuth);
    // Get provider data by name ("password", "google", etc)
    const providerData = allProviders.find((p) => p.name === name);
    const provider = new providerData.providerMethod();

    if (providerData.parameters) {
      provider.setCustomParameters(providerData.parameters);
    }

    return firebase.auth().signInWithPopup(provider).then(handleAuth);
  };

  const signout = () => {
    return firebase.auth().signOut();
  };

  const sendPasswordResetEmail = (email) => {
    return firebase.auth().sendPasswordResetEmail(email);
  };

  const confirmPasswordReset = (password, code) => {
    // Get code from query string object
    const resetCode = code || getFromQueryString("oobCode");

    return firebase.auth().confirmPasswordReset(resetCode, password);
  };

  const updateEmail = (email) => {
    return firebase
      .auth()
      .currentUser.updateEmail(email)
      .then(() => {
        // Update user in state (since onAuthStateChanged doesn't get called)
        setUser(firebase.auth().currentUser);
      });
  };

  const updatePassword = (password) => {
    return firebase.auth().currentUser.updatePassword(password);
  };

  // Update auth user and persist to database (including any custom values in data)
  // Forms can call this function instead of multiple auth/db update functions
  const updateProfile = async (data) => {
    const { email, displayName, picture } = data;

    // Update auth email
    if (email) {
      await firebase.auth().currentUser.updateEmail(email);
    }

    // Update auth profile fields
    if (displayName || picture) {
      let fields = {};
      if (displayName) fields.displayName = displayName;
      if (picture) fields.photoURL = picture;
      await firebase.auth().currentUser.updateProfile(fields);
    }

    // Persist all data to the database
    await upsertUser(firebase.auth().currentUser.uid, data);

    // Update user in state
    setUser(firebase.auth().currentUser);
  };

  useEffect(() => {
    // Subscribe to user on mount
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(false);
      }
    });

    // Unsubscribe on cleanup
    return () => unsubscribe();
  }, []);

  return {
    user: finalUser,
    getCurrentUserClaim,
    signup,
    signin,
    signinWithProvider,
    signout,
    sendPasswordResetEmail,
    confirmPasswordReset,
    updateEmail,
    updatePassword,
    updateProfile,
  };
};

const usePrepareUser = (user) => {
  // Fetch extra data from database (if enabled and auth user has been fetched)
  const userDbQuery = useUser(MERGE_DB_USER && user && user.uid);

  // Memoize so we only create a new object if user or userDbQuery changes
  return useMemo(() => {
    // Return if auth user is null (loading) or false (not authenticated)
    if (!user) return user;

    // Data we want to include from auth user object
    let finalUser = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      picture: user.photoURL,
    };

    // Include an array of user's auth providers, such as ["password", "google", etc]
    // Components can read this to prompt user to re-auth with the correct provider
    finalUser.providers = user.providerData.map(({ providerId }) => {
      return allProviders.find((p) => p.id === providerId).name;
    });

    // If merging user data from database is enabled ...
    if (MERGE_DB_USER) {
      switch (userDbQuery.status) {
        case "idle":
          // Return null user until we have db data to merge
          return null;
        case "loading":
          return null;
        case "error":
          // Log query error to console
          console.error(userDbQuery.error);
          return null;
        case "success":
          // If user data doesn't exist we assume this means user just signed up and the createUser
          // function just hasn't completed. We return null to indicate a loading state.
          if (userDbQuery.data === null) return null;

          // Merge user data from database into finalUser object
          Object.assign(finalUser, userDbQuery.data);

          // Get values we need for setting up some custom fields below
          const { stripePriceId, stripeSubscriptionStatus } = userDbQuery.data;

          // Add planId field (such as "basic", "premium", etc) based on stripePriceId
          if (stripePriceId) {
            finalUser.planId = getFriendlyPlanId(stripePriceId);
          }

          // Add planIsActive field and set to true if subscription status is "active" or "trialing"
          finalUser.planIsActive = ["active", "trialing"].includes(
            stripeSubscriptionStatus
          );

        // no default
      }
    }

    return finalUser;
  }, [user, userDbQuery]);
};

const getDisplayName = (Component) =>
  Component.displayName || Component.name || "Component";

// A Higher Order Component for requiring authentication
export const requireAuth = (Component, redirectBack) => {
  const WithAuth = (props) => {
    // Get authenticated user
    const auth = useAuth();

    useEffect(() => {
      // Redirect if not signed in
      if (auth.user === false) {
        router.replace({
          pathname: "/auth/signin",
          query: { next: redirectBack ? location.href : "" },
        });
      }
    }, [auth]);

    // Show loading indicator
    // We're either loading (user is null) or we're about to redirect (user is false)
    if (!auth.user) {
      return null;
    }

    // Render component now that we have user
    return <Component {...props} />;
  };

  WithAuth.displayName = `WithAuth(${getDisplayName(Component)})`;
  WithAuth.Layout = Component.Layout;

  return WithAuth;
};

// Handle Firebase email link for reverting to original email
export const handleRecoverEmail = (code) => {
  let originalEmail;
  return firebase
    .auth()
    .checkActionCode(code)
    .then((info) => {
      originalEmail = info.data.email;
      // Revert to original email by applying action code
      return firebase.auth().applyActionCode(code);
    })
    .then(() => {
      // Send password reset email so user can change their pass if they
      // think someone else has access to their account.
      return firebase.auth().sendPasswordResetEmail(originalEmail);
    })
    .then(() => {
      // Return original email so it can be displayed by calling component
      return originalEmail;
    });
};

// Handle Firebase email link for verifying email
export const handleVerifyEmail = (code) => {
  return firebase.auth().applyActionCode(code);
};

const allProviders = [
  {
    id: "password",
    name: "password",
  },
  {
    id: "google.com",
    name: "google",
    providerMethod: firebase.auth.GoogleAuthProvider,
  },
  {
    id: "facebook.com",
    name: "facebook",
    providerMethod: firebase.auth.FacebookAuthProvider,
    parameters: {
      // Tell fb to show popup size UI instead of full website
      display: "popup",
    },
  },
  {
    id: "twitter.com",
    name: "twitter",
    providerMethod: firebase.auth.TwitterAuthProvider,
  },
  {
    id: "github.com",
    name: "github",
    providerMethod: firebase.auth.GithubAuthProvider,
  },
];

const useIdentifyUser = (user) => {
  useEffect(() => {
    if (ANALYTICS_IDENTIFY && user) {
      analytics.identify(user.uid);
    }
  }, [user]);
};

// Waits on Firebase user to be initialized before resolving promise
// This is used to ensure auth is ready before any writing to the db can happen
const waitForFirebase = () => {
  return new Promise((resolve) => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        resolve(user); // Resolve promise when we have a user
        unsubscribe(); // Prevent from firing again
      }
    });
  });
};

const getFromQueryString = (key) => {
  return queryString.parse(window.location.search)[key];
};
