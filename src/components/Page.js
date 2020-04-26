import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { Navigation } from "components/Navigation";
import { Logo } from "components/Logo";

export const PageContainer = styled.section`
  max-width: ${({ theme }) => theme.ui.maxWidth};
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacings(12)};
  display: grid;
  grid-template-rows: max-content auto max-content;
  min-height: calc((var(--vh, 1vh) * 100));
  background: ${({ background }) => background || "transparent"};

  ${({ theme }) => theme.breakpoints.sm`
    padding: 0 ${({ theme }) => theme.spacings(4)};
  `}
`;

export const PageContent = styled.section`
  padding: ${({ theme }) => theme.spacings(5)} 0;
`;

export const PageFooter = styled.footer`
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  letter-spacing: -1px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.grey};

  a {
    margin-right: ${({ theme }) => theme.spacings(3)};
    &:hover {
      text-decoration: underline;
    }
    &:last-child {
      margin-right: 0;
    }
  }
`;

export const PageLayout = ({ children }) => (
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
    <PageFooter>
      <span>© {new Date().getFullYear()}, Kaiyu Hsu</span>
      <div>
        <Link to="/about">About</Link>
        <a href="https://github.com/tehkaiyu/yours-sincerely">Github</a>
      </div>
    </PageFooter>
  </PageContainer>
);

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
