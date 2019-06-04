import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { Formik } from 'formik';
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
import { GET_POSTS } from '@client/containers/home/Feed';

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

const CREATE_POST = gql`
  mutation CreatePost($content: String!) {
    createPost(content: $content) {
      id
      content
    }
  }
`;

const MAX_WORDS = 101;

class CreatePost extends PureComponent {
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
    return MAX_WORDS - content.split(/\W+/).length;
  };

  closeErrorState = () => {
    this.setState({ isErrorState: false });
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

  renderPostingAsRandom = () => {
    const { classes } = this.props;
    return (
      <RandomUsername>
        {({ data: { randomUsername } }) => (
          <Tooltip
            title="Since you're not logged in, we've created this name for you"
            placement="bottom"
          >
            <Text variant="caption" className={classes.dialogCaption}>
              Posting as {randomUsername}
            </Text>
          </Tooltip>
        )}
      </RandomUsername>
    );
  };

  renderPostingAsMe = (me) => {
    const { classes } = this.props;
    return (
      <Text variant="caption" className={classes.dialogCaption}>
        Posting as {me.username}
      </Text>
    );
  };

  renderPostingAs = () => {
    return (
      <CurrentUser>
        {({ data: { me } }) =>
          me ? this.renderPostingAsMe() : this.renderPostingAsRandom()
        }
      </CurrentUser>
    );
  };

  renderForm = (createPost, { loading, error }) => {
    const { classes } = this.props;
    const { open, isErrorState } = this.state;
    return (
      <Dialog
        open={open}
        onClose={this.toggleForm}
        toolbarRight={this.renderPostingAs}
      >
        <Formik
          initialValues={{ content: '' }}
          validate={this.validateForm}
          onSubmit={(values) => createPost({ variables: values })}
          render={({ handleSubmit, handleReset, handleChange, values }) => (
            <>
              <Snackbar
                open={isErrorState}
                variant="error"
                message={error && error.message}
                onClose={this.closeErrorState}
              />
              <form
                className={classes.form}
                autoComplete="off"
                onSubmit={handleSubmit}
                onReset={handleReset}
              >
                <InputBase
                  className={classes.input}
                  placeholder="Continue the story..."
                  name="content"
                  margin="none"
                  rows={10}
                  onChange={handleChange}
                  value={values.content}
                  multiline
                  fullWidth
                  autoFocus
                />
                <footer className={classes.footer}>
                  {this.renderWordsLeft(values.content)}
                  <Button
                    className={classes.submit}
                    type="submit"
                    variant="contained"
                    color="primary"
                    isLoading={loading}
                  >
                    Post
                  </Button>
                </footer>
              </form>
            </>
          )}
        />
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
        <Mutation
          mutation={CREATE_POST}
          onError={this.onSubmitError}
          onCompleted={this.onSubmitSuccess}
          update={(cache, { data: { createPost } }) => {
            const { posts } = cache.readQuery({ query: GET_POSTS });
            cache.writeQuery({
              query: GET_POSTS,
              data: { posts: posts.concat([createPost]) },
            });
          }}
        >
          {this.renderForm}
        </Mutation>
      </>
    );
  }
}

CreatePost.propTypes = {
  classes: PropTypes.object.isRequired,
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
};

export default withStyles(styles)(CreatePost);
