module.exports = ({ componentName }) => {
  return `
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Box } from '@ysds';

export default class ${componentName} extends PureComponent {
  static propTypes = {};
  render() {
    const { ...props } = this.props;
    return <Box {...props}>${componentName}</Box>
  }
}
`.trim();
};
