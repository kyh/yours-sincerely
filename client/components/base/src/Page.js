import React from 'react';
import ThemeProvider from './ThemeProvider';
import Meta from './Meta';
import Navigation from './Navigation';

const Page = ({ children }) => (
  <ThemeProvider>
    <main>
      <Meta />
      <Navigation />
      {children}
    </main>
  </ThemeProvider>
);

export default Page;
