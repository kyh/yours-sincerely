import { storiesOf } from '@storybook/react';
import React from 'react';
import { Avatar, Box } from '@components';

storiesOf('Components|Data Display|Avatars', module).add(
  'Avatar Component',
  () => (
    <Box display="flex">
      <Box mr={8}>
        <Avatar
          alt="Kaiyu Hsu"
          src="https://pbs.twimg.com/profile_images/772149934854320128/vGdhcORV_400x400.jpg"
        />
      </Box>
      <Box mr={8}>
        <Avatar>KH</Avatar>
      </Box>
    </Box>
  ),
);
