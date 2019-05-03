import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';

const styles = (theme) => ({
  root: {
    display: 'flex',
  },
  group: {
    margin: `${theme.spacing.unit}px 0`,
  },
});

function RadioButtonsGroup({
  classes,
  name,
  label,
  helperText,
  value,
  handleChange,
  controls,
}) {
  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup
        aria-label={label}
        name={name}
        className={classes.group}
        value={value}
        onChange={handleChange}
      >
        {controls.map((c) => (
          <FormControlLabel
            key={c.label}
            value={c.value}
            control={<Radio color="primary" />}
            label={c.label}
            labelPlacement={c.labelPlacement}
          />
        ))}
      </RadioGroup>
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  );
}

RadioButtonsGroup.propTypes = {
  classes: PropTypes.object.isRequired,
  // TODO: Add props.
};

export default withStyles(styles)(RadioButtonsGroup);
