/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { Button, AlertDialog, Header, Text } from '@components';
import { withStyles } from '@material-ui/core/styles';
import Link from 'next/link';

const styles = (theme) => ({
  root: {
    textAlign: 'center',
    paddingTop: theme.spacing.unit * 20,
  },
});

class Index extends React.Component {
  state = {
    open: false,
  };

  handleClose = () => {
    this.setState({
      open: false,
    });
  };

  handleClick = () => {
    this.setState({
      open: true,
    });
  };

  render() {
    const { classes } = this.props;
    const { open } = this.state;

    return (
      <div className={classes.root}>
        <AlertDialog
          isOpen={open}
          onClose={this.handleClose}
          content="1-2-3-4-5"
        />
        <Header gutterBottom>Yours Sincerely</Header>
        <Text gutterBottom>Hello world</Text>
        <Text gutterBottom>
          <Link href="/about">
            <a>Go to the about page</a>
          </Link>
        </Text>
        <Button
          variant="contained"
          color="secondary"
          onClick={this.handleClick}
        >
          Super Secret Password
        </Button>
      </div>
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Index);
