import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Header, Link } from '@components';

import Feed from '@client/containers/home/Feed';
import Create from '@client/containers/home/Create';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

class Index extends React.Component {
  componentDidMount() {
    console.log('Mounted');
  }

  render() {
    const { classes } = this.props;

    return (
      <main className={classes.root}>
        <Header gutterBottom>Yours Sincerely</Header>
        <Link href="/about">Go to the about page</Link>
        <Feed />
        <Create />
      </main>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Index);
