import { storiesOf } from '@storybook/react';
import React from 'react';
import { List, ListItem } from '@components';
import FolderIcon from '@material-ui/icons/Folder';

storiesOf('Components|List', module).add('List component', () => (
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
));
