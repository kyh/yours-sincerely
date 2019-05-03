import { storiesOf } from '@storybook/react';
import React from 'react';
import { Avatar, ProfileHeader } from '@components';
import { Flex, Box } from 'reflexbox';

storiesOf('Components|Avatars', module)
  .add('Avatar Component', () => (
    <Flex>
      <Box mr={8}>
        <Avatar
          alt="Kaiyu Hsu"
          src="https://pbs.twimg.com/profile_images/772149934854320128/vGdhcORV_400x400.jpg"
        />
      </Box>
      <Box mr={8}>
        <Avatar>KH</Avatar>
      </Box>
    </Flex>
  ))
  .add('Profile Header Component', () => (
    <Flex justify="center">
      <ProfileHeader
        name="Kaiyu Hsu"
        initials="KH"
        imageUrl="https://pbs.twimg.com/profile_images/772149934854320128/vGdhcORV_400x400.jpg"
        signInType="Facebook"
      />
    </Flex>
  ));
