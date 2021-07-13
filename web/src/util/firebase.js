import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Make sure it hasn't already been initialized
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const firestore = firebase.firestore();
const auth = firebase.auth();

if (typeof window !== "undefined" && location.hostname === "localhost") {
  firestore.useEmulator("localhost", 8080);
  auth.useEmulator("http://localhost:9099");
}

export { firebase, firestore };
