/* eslint-disable react/prop-types */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { withApollo } from 'react-apollo';
import { adopt } from 'react-adopt';
import { Formik } from 'formik';
import redirect from '@client/utils/redirect';

import {
  InputBase,
  Dialog,
  Button,
  ButtonBase,
  Text,
  Tooltip,
  Snackbar,
} from '@components';
import CurrentUser from '@client/containers/auth/CurrentUser';
import RandomUsername from '@client/containers/auth/RandomUsername';
import CreatePost from '@client/containers/home/CreatePost';
import Signup from '@client/containers/auth/Signup';

const MAX_WORDS = 100;

const styles = (theme) => ({
  button: {
    border: `2px solid ${theme.brand.borderColor}`,
    fontSize: '1.1rem',
    padding: '14px',
    borderRadius: '5px',
    width: '100%',
    justifyContent: 'left',
    cursor: 'text',
  },
  form: {
    padding: `0 ${theme.spacing(3)}px ${theme.spacing(2)}px`,
  },
  input: {
    lineHeight: '32px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  red: {
    color: theme.palette.error.main,
  },
  submit: {
    padding: `6px ${theme.spacing(3)}px`,
  },
  dialogCaption: {
    color: theme.palette.primary.main,
    paddingRight: theme.spacing(3),
  },
});

const Composed = adopt({
  post: ({ render, onError, onCompleted }) => (
    <CreatePost onError={onError} onCompleted={onCompleted}>
      {(mutation, params) => render({ mutation, params })}
    </CreatePost>
  ),
  signup: ({ render, onError, onCompleted }) => (
    <Signup onError={onError} onCompleted={onCompleted}>
      {(mutation, params) => render({ mutation, params })}
    </Signup>
  ),
  currentUser: ({ render }) => <CurrentUser>{render}</CurrentUser>,
  randomUsername: ({ render }) => <RandomUsername>{render}</RandomUsername>,
  formik: ({
    render,
    validateForm,
    onSubmit,
    post,
    currentUser,
    randomUsername,
    signup,
  }) => {
    return (
      <Formik
        initialValues={{ content: '' }}
        validate={validateForm}
        onSubmit={(values) =>
          onSubmit(values, post, currentUser, randomUsername, signup)
        }
      >
        {render}
      </Formik>
    );
  },
});

class CreatePostForm extends PureComponent {
  state = {
    open: false,
    isErrorState: false,
  };

  toggleForm = () => {
    this.setState(({ open }) => ({ open: !open }));
  };

  validateForm = ({ content }) => {
    const errors = {};

    if (!content && !content.trim()) {
      errors.content = 'This doesn’t look right...';
    } else if (this.getWordsLeft(content) < 0) {
      errors.content = 'For now, we only allow shorter stories';
    }

    return errors;
  };

  getWordsLeft = (content) => {
    return MAX_WORDS - content.split(/\W+/).length + 1;
  };

  closeErrorState = () => {
    this.setState({ isErrorState: false });
  };

  onSubmit = async (values, post, currentUser, randomUsername, signup) => {
    const { client } = this.props;
    if (!currentUser.data.me) {
      // Create an account for this user if they're not logged in.
      await signup.mutation({
        variables: {
          username: randomUsername.data.randomUsername,
          password: Math.random()
            .toString(36)
            .slice(-8),
        },
      });
    }
    await post.mutation({ variables: values });
    await client.resetStore();
    redirect({}, window.location.href);
  };

  onSubmitError = () => {
    this.setState({ isErrorState: true });
  };

  onSubmitSuccess = () => {
    this.setState({
      isErrorState: false,
      open: false,
    });
  };

  renderWordsLeft = (content) => {
    const { classes } = this.props;
    const left = this.getWordsLeft(content);
    if (left >= 0) {
      return <Text variant="caption">{left} words left</Text>;
    }
    return (
      <Text variant="caption" className={classes.red}>
        {Math.abs(left)} words over
      </Text>
    );
  };

  renderPostingAs = ({ me, username }) => {
    const { classes } = this.props;
    if (me) {
      return (
        <Text variant="caption" className={classes.dialogCaption}>
          Posting as {me.username}
        </Text>
      );
    }
    return (
      <Tooltip
        title="Since you're not logged in, we've created this name for you"
        placement="bottom"
      >
        <Text variant="caption" className={classes.dialogCaption}>
          Posting as {username}
        </Text>
      </Tooltip>
    );
  };

  renderForm = ({ post, currentUser, randomUsername, formik }) => {
    const { classes } = this.props;
    const { open, isErrorState } = this.state;
    return (
      <Dialog
        open={open}
        onClose={this.toggleForm}
        toolbarRight={this.renderPostingAs({
          me: currentUser.data.me,
          username: randomUsername.data.randomUsername,
        })}
      >
        <>
          <Snackbar
            open={isErrorState}
            variant="error"
            message={post.params.error && post.params.error.message}
            onClose={this.closeErrorState}
          />
          <form
            className={classes.form}
            autoComplete="off"
            onSubmit={formik.handleSubmit}
            onReset={formik.handleReset}
          >
            <InputBase
              className={classes.input}
              placeholder="Continue the story..."
              name="content"
              margin="none"
              rows={10}
              onChange={formik.handleChange}
              value={formik.values.content}
              multiline
              fullWidth
              autoFocus
            />
            <footer className={classes.footer}>
              {this.renderWordsLeft(formik.values.content)}
              <Button
                className={classes.submit}
                type="submit"
                variant="contained"
                color="primary"
                isLoading={post.params.loading}
              >
                {currentUser.data.me ? 'Post' : 'Write as guest'}
              </Button>
            </footer>
          </form>
        </>
      </Dialog>
    );
  };

  render() {
    const { classes } = this.props;
    return (
      <>
        <ButtonBase
          onClick={this.toggleForm}
          className={classes.button}
          disableRipple
        >
          Continue the story...
        </ButtonBase>
        <Composed
          validateForm={this.validateForm}
          onSubmit={this.onSubmit}
          onError={this.onSubmitError}
          onCompleted={this.onSubmitSuccess}
        >
          {this.renderForm}
        </Composed>
      </>
    );
  }
}

CreatePostForm.propTypes = {
  classes: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
};

export default withStyles(styles)(withApollo(CreatePostForm));
