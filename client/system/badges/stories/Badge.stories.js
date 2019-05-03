import { storiesOf } from '@storybook/react';
import React from 'react';
import MailIcon from '@material-ui/icons/Mail';
import { Flex, Box } from 'reflexbox';

import { Badge, IconButton } from '@ysds';

storiesOf('Components|Badges', module).add('Badge component', () => (
  <Box>
    <Flex justify="space-around" align="center" mb={8}>
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
    </Flex>
    <Flex justify="space-around" align="center">
      <Badge color="primary" variant="dot">
        <MailIcon />
      </Badge>
      <Badge color="secondary" variant="dot">
        <MailIcon />
      </Badge>
    </Flex>
  </Box>
));
