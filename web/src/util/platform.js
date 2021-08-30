if (typeof window !== "undefined") {
  window.config = window.config || {
    platform: "web",
  };
}

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

export const isWebMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
