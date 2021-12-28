declare global {
  var config: { platform: string } | undefined;
}

if (typeof window !== "undefined") {
  window.config = window.config || {
    platform: "web",
  };
}

export const getPlatform = () => {
  if (typeof window !== "undefined") {
    return window.config?.platform;
  }
};

export const isIOS = () => {
  if (typeof window !== "undefined") {
    return window.config?.platform === "ios";
  }
};

export const isWeb = () => {
  if (typeof window !== "undefined") {
    return window.config?.platform === "web";
  }
};

export const isAndroid = () => {
  if (typeof window !== "undefined") {
    return window.config?.platform === "android";
  }
};
