import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import NextLink from 'next/link';

const styles = (theme) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.primary.main,
    textDecoration: 'none',
    backgroundColor: 'transparent',
    borderBottom: `2px solid ${theme.palette.grey[300]}`,
    paddingBottom: 1,
    transition: 'color 0.2s linear, border-color 0.2s linear',
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
  },
});

function YSLink({ classes, children, onClick, className, ...props }) {
  return (
    <NextLink {...props}>
      <a className={`${classes.root} ${className || ''}`} onClick={onClick}>
        {children}
      </a>
    </NextLink>
  );
}

YSLink.propTypes = {
  classes: PropTypes.object.isRequired,
  children: PropTypes.any,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default withStyles(styles)(YSLink);
