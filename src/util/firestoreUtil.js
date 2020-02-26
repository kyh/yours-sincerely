// Helper functions for working with Firebase Firestore

import Firebase from 'firebase/app';
import 'firebase/auth';

export const prepareDocForCreate = doc => {
  const currentUser = Firebase.auth().currentUser;
  doc.createdBy = currentUser ? currentUser.uid : null;
  doc.createdAt = Firebase.firestore.Timestamp.now();
  doc.createdByDisplayName = currentUser ? currentUser.displayName : null;

  return doc;
};

export const prepareDocForUpdate = doc => {
  const currentUser = Firebase.auth().currentUser;
  doc.updatedBy = currentUser ? currentUser.uid : null;
  doc.updatedAt = Firebase.firestore.Timestamp.now();

  // don't save the id as part of the document
  delete doc.id;

  // don't save values that start with an underscore (these are calculated by the backend)
  Object.keys(doc).forEach(key => {
    if (key.indexOf('_') === 0) {
      delete doc[key];
    }
  });

  return doc;
};
