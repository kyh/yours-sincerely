import { storiesOf } from '@storybook/react';
import classnames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import React from 'react';
import { Header, List, ListItem, Box } from '@components';

const styles = (theme) => {
  const brandColors = Object.keys(theme.brand).reduce((map, brandColor) => {
    return {
      ...map,
      [brandColor]: { backgroundColor: theme.brand[brandColor] },
    };
  }, {});

  return {
    base: {
      width: 50,
      height: 50,
      borderRadius: '100%',
    },
    ...brandColors,
  };
};

const StyledBox = withStyles(styles)(({ classes, ...props }) => {
  const { base, ...colors } = classes;
  const c = Object.keys(colors).reduce(
    (map, color) => ({
      ...map,
      [colors[color]]: props[color],
    }),
    {},
  );

  const className = classnames(base, c);
  return <div className={className} />;
});

storiesOf('Base|Colors', module).add('Brand colors', () => (
  <Box>
    <Header>Colors</Header>
    <List dense>
      <ListItem
        icon={<StyledBox black />}
        primaryText="Black"
        secondaryText="#292C36"
      />
      <ListItem
        icon={<StyledBox backgroundGrey />}
        primaryText="Background Grey"
        secondaryText="#F6F8FD"
      />
      <ListItem
        icon={<StyledBox primary />}
        primaryText="Primary"
        secondaryText="#FF543B"
      />
      <ListItem
        icon={<StyledBox secondary />}
        primaryText="Secondary"
        secondaryText="#3B475F"
      />
      <ListItem
        icon={<StyledBox backgroundBlue />}
        primaryText="Background Blue"
        secondaryText="#C5EBFF"
      />
      <ListItem
        icon={<StyledBox lightBlue />}
        primaryText="Light Blue"
        secondaryText="#2B9DD6"
      />
      <ListItem
        icon={<StyledBox blue />}
        primaryText="Blue"
        secondaryText="#007AFF"
      />
      <ListItem
        icon={<StyledBox darkBlue />}
        primaryText="Dark Blue"
        secondaryText="#005E8C"
      />
      <ListItem
        icon={<StyledBox backgroundGreen />}
        primaryText="Background Green"
        secondaryText="#D6FCEE"
      />
      <ListItem
        icon={<StyledBox lightGreen />}
        primaryText="Light Green"
        secondaryText="#1FA67A"
      />
      <ListItem
        icon={<StyledBox green />}
        primaryText="Green"
        secondaryText="#12855F"
      />
      <ListItem
        icon={<StyledBox darkGreen />}
        primaryText="Dark Green"
        secondaryText="#006647"
      />
    </List>
  </Box>
));
