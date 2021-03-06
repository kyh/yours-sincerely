import { firebase } from "util/firebase";

export const apiRequest = async (path, method = "GET", data) => {
  const accessToken = firebase.auth().currentUser
    ? await firebase.auth().currentUser.getIdToken()
    : undefined;

  return fetch(`/api/${path}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: data ? JSON.stringify(data) : undefined,
  })
    .then((response) => response.json())
    .then((response) => {
      if (response.status === "error") {
        // Automatically signout user if accessToken is no longer valid
        if (response.code === "auth/invalid-user-token") {
          firebase.auth().signOut();
        }

        throw new CustomError(response.code, response.message);
      } else {
        return response.data;
      }
    });
};

// Create an Error with custom message and code
export const CustomError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

export const isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
