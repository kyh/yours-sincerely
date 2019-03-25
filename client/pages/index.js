/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { Header, Text } from '@components';
import { withStyles } from '@material-ui/core/styles';
import Link from 'next/link';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

const GET_FEED = gql`
  {
    feed {
      id
      content
    }
  }
`;

class Index extends React.Component {
  componentDidMount() {
    console.log('Mounted');
  }

  render() {
    const { classes } = this.props;

    return (
      <main className={classes.root}>
        <Header gutterBottom>Yours Sincerely</Header>
        <Query query={GET_FEED}>
          {({ loading, error, data }) => {
            if (loading) return 'Loading...';
            if (error) return `Error! ${error.message}`;
            return data.feed.map((post) => (
              <Text key={post.id} component="span">
                {post.content}
              </Text>
            ));
          }}
        </Query>
        <Text gutterBottom>
          <Link href="/about">
            <a>Go to the about page</a>
          </Link>
        </Text>
      </main>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Index);
