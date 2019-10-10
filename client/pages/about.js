import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Navigation from '@client/containers/Navigation';
import { Header, Text, Link } from '@components';

const styles = (theme) => ({
  page: {},
  pageContainer: {
    textAlign: 'center',
    paddingTop: theme.spacing(20),
  },
});

function About(props) {
  const { classes } = props;
  return (
    <main className={classes.page}>
      <Navigation />
      <section className={classes.pageContainer}>
        <Header>About Yours Sincerely</Header>
        <Text gutterBottom>about page</Text>
        <Link href="/">Go to the main page</Link>
      </section>
    </main>
  );
}

export default withStyles(styles)(About);
