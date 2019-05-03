module.exports = ({ componentName }) => {
  return `
import { storiesOf } from '@storybook/react';
import React from 'react';
import styled from 'styled-components';
import { ${componentName}, Box } from '@ysds';

storiesOf('${componentName}', module)
  .add('${componentName} component', () => (
    <Box padding={40}>
      {(() => {
        document.body.style.margin = '0';
        document.body.style.height = '100vh';
      })()}
      <${componentName}>${componentName}</${componentName}>
    </Box>
  ))
`.trim();
};
