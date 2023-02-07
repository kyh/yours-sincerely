const config = {
  appId: "com.kyh.yourssincerely",
  appName: "Yours Sincerely",
  webDir: "web/public/build",
  bundledWebRuntime: false,
  server: {
    // url: "http://localhost:3000",
    url: "https://yourssincerely.org",
    cleartext: true,
  },
  ios: {
    allowsLinkPreview: false,
    scheme: "Yours Sincerely",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

module.exports = config;
