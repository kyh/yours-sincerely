import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kyh.yourssincerely",
  appName: "Yours Sincerely",
  server: {
    // url: "http://localhost:3000",
    url: "https://yourssincerely.org",
  },
  ios: {
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
