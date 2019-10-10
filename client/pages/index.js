import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Navigation from '@client/containers/Navigation';

const styles = (theme) => ({
  container: {
    maxWidth: theme.brand.maxWidth,
    margin: 'auto',
    padding: `${theme.spacing(5)}px ${theme.spacing(3)}px`,
  },
  feed: {
    marginBottom: theme.spacing(3),
  },
  create: {
    marginBottom: theme.spacing(2),
  },
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    '& a': {
      border: 'none',
      color: theme.palette.secondary.light,
    },
    '& a:hover': {
      border: 'none',
      color: theme.palette.secondary.dark,
    },
  },
});

function Home({ currentPage, classes }) {
  return (
    <main>
      <Navigation />
      Main
    </main>
  );
}

/* <Query query={PAGINATION_QUERY}>
        {({ data, loading, error }) => {
          if (loading || error) return null;
          const { count } = data.postsConnection.aggregate;
          const totalPages = Math.ceil(count / perPage);
          const page = currentPage || totalPages;
          return (
            <section className={classes.container}>
              <section className={classes.feed}>
                <FeedContent currentPage={page} />
              </section>
              <section className={classes.create}>
                <CreatePostForm currentPage={page} totalPages={totalPages} />
              </section>
              <section className={classes.pagination}>
                <Pagination currentPage={page} totalPages={totalPages} />
              </section>
            </section>
          );
        }}
      </Query> */

Home.getInitialProps = ({ query }) => {
  return { currentPage: parseFloat(query.page) };
};

Home.propTypes = {
  classes: PropTypes.object.isRequired,
  currentPage: PropTypes.number,
};

export default withStyles(styles)(Home);
