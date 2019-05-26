import React from 'react';
import PropTypes from 'prop-types';
import { Query } from 'react-apollo';
import { withStyles } from '@material-ui/core/styles';
import { perPage } from '@client/utils/constants';

import Feed from '@client/containers/home/Feed';
import Create from '@client/containers/home/Create';
import Pagination, {
  PAGINATION_QUERY,
} from '@client/containers/home/Pagination';

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

function HomeContent({ currentPage, classes }) {
  return (
    <Query query={PAGINATION_QUERY}>
      {({ data, loading, error }) => {
        if (loading || error) return null;
        const { count } = data.postsConnection.aggregate;
        const totalPages = Math.ceil(count / perPage);
        const page = currentPage || totalPages;
        return (
          <section className={classes.container}>
            <section className={classes.feed}>
              <Feed currentPage={page} />
            </section>
            <section className={classes.create}>
              <Create currentPage={page} totalPages={totalPages} />
            </section>
            <section className={classes.pagination}>
              <Pagination currentPage={page} totalPages={totalPages} />
            </section>
          </section>
        );
      }}
    </Query>
  );
}

HomeContent.propTypes = {
  classes: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
};

export default withStyles(styles)(HomeContent);
