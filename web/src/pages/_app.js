import { Fragment } from "react";
import { AuthProvider } from "actions/auth";
import { ThemeProvider } from "util/theme";
import "util/analytics";

const MyApp = ({ Component, pageProps }) => {
  const Layout = Component.Layout ? Component.Layout : Fragment;
  return (
    <ThemeProvider>
      <AuthProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default MyApp;
