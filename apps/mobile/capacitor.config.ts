import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kyh.yourssincerely",
  appName: "Yours Sincerely",
  ios: {
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
  server: {
    // url: "http://localhost:3000",
    url: "https://yourssincerely.org",
  },
};

export default config;
