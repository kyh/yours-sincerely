const config = {
  appId: "com.kyh.yourssincerely",
  appName: "Yours Sincerely",
  webDir: "web/public/build",
  bundledWebRuntime: false,
  server: {
    url:
      process.env.NODE_ENV === "production"
        ? "https://yourssincerely.org"
        : "http://localhost:3000",
    cleartext: true,
  },
};

module.exports = config;
