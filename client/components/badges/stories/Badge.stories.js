import { storiesOf } from '@storybook/react';
import React from 'react';
import MailIcon from '@material-ui/icons/Mail';
import { Badge, IconButton, Box } from '@components';

storiesOf('Components|Data Display|Badges', module).add(
  'Badge component',
  () => (
    <Box>
      <Box
        display="flex"
        justifyContent="space-around"
        alignItems="center"
        mb={8}
      >
        <Badge badgeContent={4} color="primary">
          <MailIcon />
        </Badge>
        <Badge badgeContent={10} color="secondary">
          <MailIcon />
        </Badge>
        <IconButton aria-label="4 pending messages">
          <Badge badgeContent={4} color="primary">
            <MailIcon />
          </Badge>
        </IconButton>
      </Box>
      <Box display="flex" justifyContent="space-around" alignItems="center">
        <Badge color="primary" variant="dot">
          <MailIcon />
        </Badge>
        <Badge color="secondary" variant="dot">
          <MailIcon />
        </Badge>
      </Box>
    </Box>
  ),
);
