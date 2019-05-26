import { storiesOf } from '@storybook/react';
import React from 'react';
import SwipeableViews from 'react-swipeable-views';
import { Tabs, Tab, List, ListItem } from '@components';
import FolderIcon from '@material-ui/icons/Folder';

class TabbedSection extends React.Component {
  state = {
    currentTabIndex: 0,
  };

  handleChange = (event, currentTabIndex) => {
    this.setState({ currentTabIndex });
  };

  handleChangeIndex = (index) => {
    this.setState({ currentTabIndex: index });
  };

  render() {
    const { currentTabIndex } = this.state;
    return (
      <div>
        <Tabs
          value={currentTabIndex}
          onChange={this.handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Item One" />
          <Tab label="Item Two" />
          <Tab label="Item Three" />
        </Tabs>
        <SwipeableViews
          index={currentTabIndex}
          onChangeIndex={this.handleChangeIndex}
        >
          <List dense>
            <ListItem
              button
              icon={<FolderIcon />}
              primaryText="Single-line item"
              secondaryText="Secondary text"
            />
            <ListItem
              button
              icon={<FolderIcon />}
              primaryText="Single-line item2"
              secondaryText="Secondary text2"
            />
            <ListItem
              button
              icon={<FolderIcon />}
              primaryText="Single-line item3"
              secondaryText="Secondary text3"
            />
          </List>
          <List dense>
            <ListItem
              button
              icon={<FolderIcon />}
              primaryText="Single-line item"
              secondaryText="Secondary text"
            />
          </List>
          <List dense>
            <ListItem
              button
              icon={<FolderIcon />}
              primaryText="Single-line item"
              secondaryText="Secondary text"
            />
          </List>
        </SwipeableViews>
      </div>
    );
  }
}

storiesOf('Components|Navigation|Tabs', module).add('Tabs component', () => (
  <TabbedSection />
));
