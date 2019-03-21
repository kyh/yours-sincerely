import React from 'react';
import Typography from '@material-ui/core/Typography';

const Header = ({ children, ...props }) => {
  return (
    <Typography gutterBottom {...props}>
      {children}
    </Typography>
  );
};

Header.defaultProps = {
  component: 'h1',
  variant: 'h4',
};

export default Header;
