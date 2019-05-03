import React from 'react';
import Avatar from '@material-ui/core/Avatar';
import ButtonBase from '@material-ui/core/ButtonBase';
import { withStyles } from '@material-ui/core/styles';

import { Header, Text } from '@ysds';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    display: 'block',
  },
  avatar: {
    margin: '0 auto 10px',
    width: 55,
    height: 55,
  },
  text: {
    fontSize: '0.8rem',
  },
};

const ProfileHeader = ({
  classes,
  name,
  imageUrl,
  signInType,
  initials,
  handleProfileClick,
  ...props
}) => {
  return (
    <div className={classes.container}>
      <ButtonBase
        className={classes.button}
        onClick={handleProfileClick}
        disableRipple
      >
        <Avatar className={classes.avatar} alt={name} src={imageUrl}>
          {initials}
        </Avatar>
        <Header>{name}</Header>
      </ButtonBase>
      <Text className={classes.text}>Logged in with {signInType}</Text>
    </div>
  );
};

export default React.memo(withStyles(styles)(ProfileHeader));
