import AsyncStorage from "@react-native-async-storage/async-storage";

/** Draft persistence — mirrors the web's localStorage["post-form"]. */
const POST_DRAFT_KEY = "post-form";

export const getPostDraft = () => AsyncStorage.getItem(POST_DRAFT_KEY);

export const setPostDraft = (content: string) => {
  if (content === "") {
    return AsyncStorage.removeItem(POST_DRAFT_KEY);
  }
  return AsyncStorage.setItem(POST_DRAFT_KEY, content);
};

export const clearPostDraft = () => AsyncStorage.removeItem(POST_DRAFT_KEY);
