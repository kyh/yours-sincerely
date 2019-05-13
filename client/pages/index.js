import React from 'react';
import PropTypes from 'prop-types';
import Navigation from '@client/containers/auth/Navigation';
import HomeContent from '@client/containers/home/HomeContent';

function Home({ currentPage }) {
  return (
    <main>
      <Navigation />
      <HomeContent currentPage={currentPage} />
    </main>
  );
}

Home.getInitialProps = ({ query }) => {
  return { currentPage: parseFloat(query.page) };
};

Home.propTypes = {
  currentPage: PropTypes.number.isRequired,
};

export default Home;
