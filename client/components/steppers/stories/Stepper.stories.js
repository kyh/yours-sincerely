import { storiesOf } from '@storybook/react';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { MobileStepper, Button } from '@components';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

// Mobile Stepper
const styles = {
  root: {
    maxWidth: 400,
    flexGrow: 1,
  },
};

class ProgressMobileStepper extends React.Component {
  state = {
    activeStep: 0,
  };

  handleNext = () => {
    this.setState((state) => ({
      activeStep: state.activeStep + 1,
    }));
  };

  handleBack = () => {
    this.setState((state) => ({
      activeStep: state.activeStep - 1,
    }));
  };

  render() {
    const { classes, theme } = this.props;

    return (
      <MobileStepper
        variant="progress"
        steps={6}
        position="static"
        activeStep={this.state.activeStep}
        className={classes.root}
        nextButton={
          <Button
            size="small"
            onClick={this.handleNext}
            disabled={this.state.activeStep === 5}
          >
            Next
            {theme.direction === 'rtl' ? (
              <KeyboardArrowLeft />
            ) : (
              <KeyboardArrowRight />
            )}
          </Button>
        }
        backButton={
          <Button
            size="small"
            onClick={this.handleBack}
            disabled={this.state.activeStep === 0}
          >
            {theme.direction === 'rtl' ? (
              <KeyboardArrowRight />
            ) : (
              <KeyboardArrowLeft />
            )}
            Back
          </Button>
        }
      />
    );
  }
}

const StyledProgressMobileStepper = withStyles(styles, { withTheme: true })(
  ProgressMobileStepper,
);

storiesOf('Components|Stepper', module).add('Mobile Stepper Component', () => (
  <StyledProgressMobileStepper />
));
