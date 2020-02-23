// this Layout component wraps every page with the app header on top
// check out App.js to see how it's used

import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import Logo from 'components/Logo';
import logIn from 'actions/logIn';
import FirebaseAuth from 'views/misc/FirebaseAuth';

const Layout = ({ children }) => (
  <PageContainer>
    <Navigation>
      <HeaderLink to="/">
        <Logo />
      </HeaderLink>
      <div>
        <FirebaseAuth>
          {({ isLoading, error, auth }) => {
            if (isLoading) {
              return '...';
            }
            if (error) {
              return '⚠️ login error';
            }
            if (auth) {
              return (
                <HeaderLink to={`/account`}>
                  <span role="img" aria-label="account">
                    👤
                  </span>
                </HeaderLink>
              );
            } else {
              return <button onClick={logIn}>log in</button>;
            }
          }}
        </FirebaseAuth>
      </div>
    </Navigation>
    {children}
    <Footer>© {new Date().getFullYear()}</Footer>
  </PageContainer>
);

export default Layout;

const PageContainer = styled.div`
  max-width: ${({ theme }) => theme.ui.maxWidth};
  margin: 0 auto;
  display: grid;
  grid-template-rows: max-content auto max-content;
  min-height: 100vh;
`;

const Navigation = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacings(3)};
`;

const HeaderLink = styled(Link)`
  color: ${({ theme }) => theme.colors.black};
  text-decoration: none;
  font-size: 1.2rem;
`;

const Page = styled.div`
  padding: 1rem;
`;

const Footer = styled.div`
  padding: 1rem;
  text-align: center;
  opacity: 0.3;
`;
