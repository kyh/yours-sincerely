import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Header, Link } from '@components';

import Feed from '@client/containers/home/Feed';
import Create from '@client/containers/home/Create';

const styles = (theme) => ({
  page: {
    textAlign: 'center',
  },
  container: {
    maxWidth: 1300,
    margin: 'auto',
    padding: '0 20px',
  },
  textContainer: {
    margin: 'auto',
  },
});

class Index extends React.Component {
  componentDidMount() {
    console.log('Mounted');
  }

  render() {
    const { classes } = this.props;

    return (
      <main className={classes.page}>
        <section className={classes.container}>
          <Header gutterBottom>Yours Sincerely</Header>
          <Feed />
          <footer className={classes.textContainer}>
            <Create />
          </footer>
        </section>
      </main>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Index);
