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
import { GET_POSTS } from '@client/containers/home/Feed';
import { SIGNUP } from '@client/containers/auth/Signup';

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
  // eslint-disable-next-line react/prop-types
  post: ({ render, onError, onCompleted, update }) => (
    <CreatePost onError={onError} onCompleted={onCompleted} update={update}>
      {(createPost, createPostProps) => render({ createPost, createPostProps })}
    </CreatePost>
  ),
  // eslint-disable-next-line react/prop-types
  currentUser: ({ render }) => <CurrentUser>{render}</CurrentUser>,
  // eslint-disable-next-line react/prop-types
  randomUsername: ({ render }) => <RandomUsername>{render}</RandomUsername>,
  // eslint-disable-next-line react/prop-types
  formik: ({ render, validateForm, onSubmit }) => {
    return (
      <Formik
        initialValues={{ content: '' }}
        validate={validateForm}
        onSubmit={onSubmit}
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

  onSubmit = async (values, me, createPost) => {
    const { client } = this.props;
    if (!me) {
      // Create an account for this user if they're not logged in.
      const { data } = await client.query({ query: GET_RANDOM_USERNAME });
      await client.mutate({
        mutation: SIGNUP,
        variables: {
          username: data.randomUsername,
          password: Math.random()
            .toString(36)
            .slice(-8),
        },
      });
    }
    await createPost({ variables: values });
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

  onUpdate = (cache, { data: { createPost } }) => {
    const { posts } = cache.readQuery({ query: GET_POSTS });
    cache.writeQuery({
      query: GET_POSTS,
      data: { posts: posts.concat([createPost]) },
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

  renderPostingAsRandom = (username) => {
    const { classes } = this.props;
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

  renderPostingAsMe = (username) => {
    const { classes } = this.props;
    return (
      <Text variant="caption" className={classes.dialogCaption}>
        Posting as {username}
      </Text>
    );
  };

  renderPostingAs = ({ me, username }) => {
    return me
      ? this.renderPostingAsMe(me.username)
      : this.renderPostingAsRandom(username);
  };

  renderForm = ({ post, currentUser, randomUsername, formik }) => {
    const { classes } = this.props;
    const { open, isErrorState } = this.state;
    console.log(post, currentUser, randomUsername, formik);
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
            message={
              post.createPostProps.error && post.createPostProps.error.message
            }
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
                isLoading={post.createPostProps.loading}
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
          update={this.onUpdate}
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
