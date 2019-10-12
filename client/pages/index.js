import React from 'react';
import PropTypes from 'prop-types';
import { useGetPostsAggregate } from '@client/hooks/getPostsAggregate';
import { perPage } from '@client/utils/constants';
import { withStyles } from '@material-ui/core/styles';
import FeedContent from '@client/containers/FeedContent';
import CreatePostForm from '@client/containers/CreatePostForm';
import Pagination from '@client/containers/Pagination';
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
  const { loading, error, data } = useGetPostsAggregate();
  if (loading || error) return null;
  const { count } = data.posts_aggregate.aggregate;
  const totalPages = Math.ceil(count / perPage);
  const page = currentPage || totalPages;

  return (
    <main>
      <Navigation />
      <section className={classes.container}>
        <section className={classes.feed}>
          <FeedContent currentPage={page} />
        </section>
        <section className={classes.create}>
          {/* <CreatePostForm currentPage={page} totalPages={totalPages} /> */}
        </section>
        <section className={classes.pagination}>
          <Pagination currentPage={page} totalPages={totalPages} />
        </section>
      </section>
    </main>
  );
}

Home.getInitialProps = ({ query }) => {
  return { currentPage: parseFloat(query.page) };
};

Home.propTypes = {
  classes: PropTypes.object.isRequired,
  currentPage: PropTypes.number,
};

export default withStyles(styles)(Home);
