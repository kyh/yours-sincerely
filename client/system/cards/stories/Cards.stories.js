import { storiesOf } from '@storybook/react';
import React from 'react';
import { Card, CardContent, Header, Text } from '@ysds';

storiesOf('Components|Cards', module).add('Simple Card component', () => (
  <Card>
    <CardContent>
      <Header>Cards</Header>
      <Text>
        Card components can be used to display a block of information across the
        app
      </Text>
    </CardContent>
  </Card>
));
