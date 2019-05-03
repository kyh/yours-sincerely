import { storiesOf } from '@storybook/react';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Header,
  Text,
} from '@components';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

const styles = (theme) => ({
  root: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
});

class ExpansionPanels extends React.Component {
  state = {
    expanded: null,
  };

  handleChange = (panel) => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false,
    });
  };

  render() {
    const { classes } = this.props;
    const { expanded } = this.state;

    return (
      <div className={classes.root}>
        <ExpansionPanel
          expanded={expanded === 'panel1'}
          onChange={this.handleChange('panel1')}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Header className={classes.heading}>General settings</Header>
            <Header className={classes.secondaryHeading}>
              I am an expansion panel
            </Header>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Text>
              Nulla facilisi. Phasellus sollicitudin nulla et quam mattis
              feugiat. Aliquam eget maximus est, id dignissim quam.
            </Text>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <ExpansionPanel
          expanded={expanded === 'panel2'}
          onChange={this.handleChange('panel2')}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Header className={classes.heading}>Users</Header>
            <Header className={classes.secondaryHeading}>
              You are currently not an owner
            </Header>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Text>
              Donec placerat, lectus sed mattis semper, neque lectus feugiat
              lectus, varius pulvinar diam eros in elit. Pellentesque convallis
              laoreet laoreet.
            </Text>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <ExpansionPanel
          expanded={expanded === 'panel3'}
          onChange={this.handleChange('panel3')}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Header className={classes.heading}>Advanced settings</Header>
            <Header className={classes.secondaryHeading}>
              Filtering has been entirely disabled for whole web server
            </Header>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Text>
              Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer
              sit amet egestas eros, vitae egestas augue. Duis vel est augue.
            </Text>
          </ExpansionPanelDetails>
        </ExpansionPanel>
        <ExpansionPanel
          expanded={expanded === 'panel4'}
          onChange={this.handleChange('panel4')}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Header className={classes.heading}>Personal data</Header>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <Text>
              Nunc vitae orci ultricies, auctor nunc in, volutpat nisl. Integer
              sit amet egestas eros, vitae egestas augue. Duis vel est augue.
            </Text>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}

const StyledExpansionPanel = withStyles(styles)(ExpansionPanels);

storiesOf('Components|ExpansionPanel', module).add(
  'ExpansionPanel component',
  () => <StyledExpansionPanel />,
);
