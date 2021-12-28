module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "HelveticaNow",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          "Arial",
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
        ],
      },
      colors: {
        primary: "#8389E1",
        secondary: "#3B475F",
      },
    },
  },
  variants: {},
  plugins: [require("@tailwindcss/typography")],
};
