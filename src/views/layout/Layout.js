// this Layout component wraps every page with the app header on top
// check out App.js to see how it's used

import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import Navigation from 'components/Navigation';
import Logo from 'components/Logo';
import PageContainer from 'components/PageContainer';
import PageFooter from 'components/PageFooter';

const Layout = ({ children }) => (
  <PageContainer>
    <Navigation>
      <NavLink to="/">
        <Logo />
      </NavLink>
      <NavRight>
        <NavLink to="/profile">Profile</NavLink>
        <NavButtonLink to="/new">New Post</NavButtonLink>
      </NavRight>
    </Navigation>
    {children}
    <PageFooter>© {new Date().getFullYear()}</PageFooter>
  </PageContainer>
);

export default Layout;

const NavRight = styled.div`
  a {
    margin-right: ${({ theme }) => theme.spacings(5)};
    &:last-of-type {
      margin-right: 0;
    }
  }
`;

const NavLink = styled(Link)`
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const NavButtonLink = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => `${theme.spacings(1)} ${theme.spacings(3)}`};
  border-radius: 4px;
  &:hover {
    color: ${({ theme }) => theme.ui.button.hover.background};
    border-color: ${({ theme }) => theme.ui.button.hover.background};
  }
  &:active {
    transform: scale(0.95);
  }
`;
