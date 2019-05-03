import React, { PureComponent } from 'react';
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
} from '@ysds';
import { GET_POSTS } from './Feed';

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
    padding: `0 ${theme.spacing.unit * 3}px ${theme.spacing.unit * 2}px`,
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
    padding: `6px ${theme.spacing.unit * 3}px`,
  },
  dialogCaption: {
    color: theme.palette.primary.main,
    paddingRight: theme.spacing.unit * 3,
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
    isOpen: false,
    isErrorState: false,
  };

  toggleForm = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
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
      isOpen: false,
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

  renderPostingAs = () => {
    const { classes } = this.props;
    return (
      <Tooltip
        title="Since you're not logged in, we've created this name for you"
        placement="bottom"
      >
        <Text variant="caption" className={classes.dialogCaption}>
          Posting as whale-freak-3
        </Text>
      </Tooltip>
    );
  };

  renderForm = (createPost, { loading, error }) => {
    const { classes } = this.props;
    const { isOpen } = this.state;
    return (
      <Dialog
        isOpen={isOpen}
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
                isOpen={this.state.isErrorState}
                variant="error"
                message={error && error.graphQLErrors[0].message}
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
      <section>
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
      </section>
    );
  }
}

export default withStyles(styles)(CreatePost);
