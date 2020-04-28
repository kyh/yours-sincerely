window.config = window.config || {
  platform: "web",
};

export const getPlatform = () => {
  return window.config.platform;
};

export const isIOS = () => {
  return window.config.platform === "ios";
};

export const isWeb = () => {
  return window.config.platform === "web";
};

export const isAndroid = () => {
  return window.config.platform === "android";
};
