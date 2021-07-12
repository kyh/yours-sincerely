import { useReducer, useEffect, useRef } from "react";
import firebase from "./firebase";

export { firebase };

export const firestore = firebase.firestore();

export const prepareDocForCreate = (doc) => {
  const currentUser = firebase.auth().currentUser;
  doc.createdBy = currentUser ? currentUser.uid : null;
  doc.createdByDisplayName = currentUser ? currentUser.displayName : null;
  doc.createdAt = firebase.firestore.Timestamp.now();

  return doc;
};

export const prepareDocForUpdate = (doc) => {
  const currentUser = firebase.auth().currentUser;
  doc.updatedBy = currentUser ? currentUser.uid : null;
  doc.updatedAt = firebase.firestore.Timestamp.now();

  // don't save the id as part of the document
  delete doc.id;

  // don't save values that start with an underscore (these are calculated by the backend)
  Object.keys(doc).forEach((key) => {
    if (key.indexOf("_") === 0) {
      delete doc[key];
    }
  });

  return doc;
};

// Reducer for useQuery hook state and actions
const reducer = (state, action) => {
  switch (action.type) {
    case "idle":
      return { status: "idle", data: undefined, error: undefined };
    case "loading":
      return { status: "loading", data: undefined, error: undefined };
    case "success":
      return { status: "success", data: action.payload, error: undefined };
    case "error":
      return { status: "error", data: undefined, error: action.payload };
    case "update":
      return {
        ...state,
        data: state.data
          ? { ...state.data, ...action.payload }
          : action.payload,
      };
    default:
      throw new Error("invalid action");
  }
};

export const useQuery = (query) => {
  // Our initial state
  // Start with an "idle" status if query is falsy, as that means hook consumer is
  // waiting on required data before creating the query object.
  // Example: useQuery(uid && firestore.collection("profiles").doc(uid))
  const initialState = {
    status: query ? "loading" : "idle",
    data: undefined,
    error: undefined,
  };

  // Setup our state and actions
  const [state, dispatch] = useReducer(reducer, initialState);

  // Gives us previous query object if query is the same, ensuring
  // we don't trigger useEffect on every render due to query technically
  // being a new object reference on every render.
  const queryCached = useMemoCompare(query, (prevQuery) => {
    // Use built-in Firestore isEqual method to determine if "equal"
    return prevQuery && query && query.isEqual(prevQuery);
  });

  useEffect(() => {
    // Return early if query is falsy and reset to "idle" status in case
    // we're coming from "success" or "error" status due to query change.
    if (!queryCached) {
      dispatch({ type: "idle" });
      return;
    }

    dispatch({ type: "loading" });

    // Subscribe to query with onSnapshot
    // Will unsubscribe on cleanup since this returns an unsubscribe function
    return queryCached.onSnapshot(
      (response) => {
        // Get data for collection or doc
        const data = response.docs
          ? getCollectionData(response)
          : getDocData(response);

        dispatch({ type: "success", payload: data });
      },
      (error) => {
        dispatch({ type: "error", payload: error });
      }
    );
  }, [queryCached]); // Only run effect if queryCached changes

  return { ...state, dispatch };
};

const getDocData = (doc) =>
  doc.exists === true ? { id: doc.id, ...doc.data() } : null;
const getCollectionData = (collection) => collection.docs.map(getDocData);

const useMemoCompare = (next, compare) => {
  // Ref for storing previous value
  const previousRef = useRef();
  const previous = previousRef.current;

  // Pass previous and next value to compare function
  // to determine whether to consider them equal.
  const isEqual = compare(previous, next);

  // If not equal update previousRef to next value.
  // We only update if not equal so that this hook continues to return
  // the same old value if compare keeps returning true.
  useEffect(() => {
    if (!isEqual) {
      previousRef.current = next;
    }
  });

  // Finally, if equal then return the previous value
  return isEqual ? previous : next;
};
