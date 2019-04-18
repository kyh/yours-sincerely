import React, { PureComponent } from 'react';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { Formik, Form } from 'formik';
import {
  InputBase,
  Dialog,
  Button,
  ButtonBase,
  Text,
  Tooltip,
} from '@components';
import { GET_FEED } from './Feed';

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

const CREATE_DRAFT = gql`
  mutation CreateDraft($content: String!) {
    createDraft(content: $content) {
      id
      content
    }
  }
`;

const MAX_WORDS = 101;

class CreateDraft extends PureComponent {
  state = {
    isOpen: false,
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

  renderForm = (createDraft) => {
    const { isOpen } = this.state;
    const { classes } = this.props;
    return (
      <Dialog
        isOpen={isOpen}
        onClose={this.toggleForm}
        toolbarRight={this.renderPostingAs}
      >
        <Formik
          initialValues={{ content: '' }}
          validate={this.validateForm}
          onSubmit={(values) => {
            console.log(values);
            createDraft({ variables: values });
          }}
        >
          {({ values, handleChange, isSubmitting }) => (
            <Form autoComplete="off" className={classes.form}>
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
                  isLoading={isSubmitting}
                >
                  Post
                </Button>
              </footer>
            </Form>
          )}
        </Formik>
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
          mutation={CREATE_DRAFT}
          update={(cache, { data: { createDraft } }) => {
            const { posts } = cache.readQuery({ query: GET_FEED });
            cache.writeQuery({
              query: GET_FEED,
              data: { posts: posts.concat([createDraft]) },
            });
          }}
        >
          {this.renderForm}
        </Mutation>
      </section>
    );
  }
}

export default withStyles(styles)(CreateDraft);
