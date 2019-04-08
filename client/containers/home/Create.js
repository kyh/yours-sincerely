import React, { PureComponent } from 'react';
import { Transition } from 'react-transition-group';
import gql from 'graphql-tag';
import { withStyles } from '@material-ui/core/styles';
import { Mutation } from 'react-apollo';
import { TextField, Button, ButtonBase } from '@components';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

const styles = (theme) => ({
  background: {},
  form: {
    minWidth: theme.brand.maxWidth,
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

const GET_FEED = gql`
  {
    feed {
      id
      content
    }
  }
`;

const validationSchema = Yup.object().shape({
  content: Yup.string()
    .max(500, 'For now, we only allow short stories')
    .required("Don't forget the details"),
});

class CreateDraft extends PureComponent {
  state = {
    isOpen: false,
  };

  toggleForm = () => {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  };

  renderForm = (createDraft) => {
    const { isOpen } = this.state;
    const { classes } = this.props;
    return (
      <Transition in={isOpen} timeout={500}>
        {(state) => (
          <>
            <div className={classes.background} />
            <Formik
              initialValues={{ content: '' }}
              validationSchema={validationSchema}
              onSubmit={(values) => {
                createDraft({ variables: values });
              }}
            >
              <Form autoComplete="off" className={classes.form}>
                <TextField
                  name="content"
                  margin="normal"
                  variant="outlined"
                  fullWidth
                  autoFocus
                />
                <Button type="submit">Publish</Button>
              </Form>
            </Formik>
          </>
        )}
      </Transition>
    );
  };

  render() {
    return (
      <section>
        <ButtonBase onClick={this.toggleForm}>Continue the story...</ButtonBase>
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
