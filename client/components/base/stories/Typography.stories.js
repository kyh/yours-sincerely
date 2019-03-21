import { storiesOf } from '@storybook/react';
import React from 'react';
import { Box } from 'reflexbox';

import { Header, Text, Divider } from '@components';

storiesOf('Base|Typography', module)
  .add('Header component', () => (
    <Box>
      <Header component="h1" variant="h1">
        h1. Header
      </Header>
      <Header component="h2" variant="h2">
        h2. Header
      </Header>
      <Header component="h3" variant="h3">
        h3. Header
      </Header>
      <Header component="h4" variant="h4">
        h4. Header
      </Header>
      <Header component="h5" variant="h5">
        h5. Header
      </Header>
      <Header component="h6" variant="h6">
        h6. Header
      </Header>
      <Box my={10}>
        <Divider />
      </Box>
      <Header>Default Header</Header>
    </Box>
  ))
  .add('Text component', () => (
    <Box>
      <Text gutterBottom>
        Default Text. Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        Quos blanditiis tenetur
      </Text>
      <Box my={10}>
        <Divider />
      </Box>
      <Text variant="subtitle1" gutterBottom>
        subtitle1. Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        Quos blanditiis tenetur
      </Text>
      <Box my={10}>
        <Divider />
      </Box>
      <Text variant="body1" gutterBottom>
        body1. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos
        blanditiis tenetur unde suscipit, quam beatae rerum inventore
        consectetur, neque doloribus, cupiditate numquam dignissimos laborum
        fugiat deleniti? Eum quasi quidem quibusdam.
      </Text>
      <Box my={10}>
        <Divider />
      </Box>
      <Text variant="body2" gutterBottom>
        body2. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quos
        blanditiis tenetur unde suscipit, quam beatae rerum inventore
        consectetur, neque doloribus, cupiditate numquam dignissimos laborum
        fugiat deleniti? Eum quasi quidem quibusdam.
      </Text>
      <Box my={10}>
        <Divider />
      </Box>
      <Text variant="button" gutterBottom>
        button text
      </Text>
      <Box my={10}>
        <Divider />
      </Box>
      <Text variant="caption" gutterBottom>
        caption text
      </Text>
      <Box my={10}>
        <Divider />
      </Box>
      <Text variant="overline">overline text</Text>
    </Box>
  ));
