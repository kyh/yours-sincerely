const config = {
  appId: "com.kyh.yourssincerely",
  appName: "Yours Sincerely",
  server: {
    url: "https://beta.yourssincerely.org",
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
