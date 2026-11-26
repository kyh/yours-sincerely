import AsyncStorage from "@react-native-async-storage/async-storage";

const POST_DRAFT_KEY = "post-form";

export const getPostDraft = async () => await AsyncStorage.getItem(POST_DRAFT_KEY);

export const setPostDraft = async (content: string) => {
  if (content === "") {
    await AsyncStorage.removeItem(POST_DRAFT_KEY);

    return;
  }

  await AsyncStorage.setItem(POST_DRAFT_KEY, content);
};

export const clearPostDraft = async () => {
  await AsyncStorage.removeItem(POST_DRAFT_KEY);
};
