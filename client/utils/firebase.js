import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

const config = {
  apiKey: 'AIzaSyAR3sfAAEYE5COB-QC9FB9K9Jq1N2bugXo',
  authDomain: 'yours-sincerely.firebaseapp.com',
  databaseURL: 'https://yours-sincerely.firebaseio.com',
  projectId: 'yours-sincerely',
  storageBucket: 'yours-sincerely.appspot.com',
  messagingSenderId: '310023005611',
  appId: '1:310023005611:web:7f5873787864eea9905eee',
  measurementId: 'G-V3LSLZMELP',
};

export default !firebase.apps.length
  ? firebase.initializeApp(config)
  : firebase.app();
