import { storiesOf } from '@storybook/react';
import { State, Store } from '@sambego/storybook-state';
import React from 'react';
import {
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Select,
} from '@components';

const store = new Store({
  checked: true,
  selectedValue: 'a',
  value: 10,
});

storiesOf('Components|Inputs|Selects', module)
  .add('Checkboxes', () => (
    <div>
      <div>
        <State store={store}>
          <Checkbox
            onChange={(e) => store.set({ checked: e.target.checked })}
            value="checked"
          />
        </State>
        <Checkbox value="checkedB" color="primary" checked />
        <Checkbox disabled value="checkedD" />
        <Checkbox disabled checked value="checkedE" />
        <Checkbox value="checkedF" indeterminate />
        <Checkbox defaultChecked color="default" value="checkedG" />
      </div>
      <div>
        <CheckboxGroup
          label="Checkbox group"
          helperText="Group of checkboxes"
          controls={[
            { label: 'Brandon' },
            { label: 'Johnson' },
            { label: 'Jack' },
          ]}
        />
      </div>
      <div>
        <CheckboxGroup
          type="switch"
          label="Switch group"
          helperText="Group of checkboxes"
          controls={[
            { label: 'Brandon' },
            { label: 'Johnson' },
            { label: 'Jack' },
          ]}
        />
      </div>
    </div>
  ))
  .add('Radios', () => (
    <div>
      <div>
        <Radio
          checked={store.get('selectedValue') === 'a'}
          onChange={(e) => store.set({ selectedValue: e.target.value })}
          value="a"
          name="radio-button-demo"
          aria-label="A"
        />
        <Radio
          checked={store.get('selectedValue') === 'b'}
          onChange={(e) => store.set({ selectedValue: e.target.value })}
          value="b"
          name="radio-button-demo"
          aria-label="B"
        />
        <Radio
          checked={store.get('selectedValue') === 'c'}
          onChange={(e) => store.set({ selectedValue: e.target.value })}
          value="c"
          name="radio-button-demo"
          aria-label="C"
        />
        <Radio
          checked={store.get('selectedValue') === 'd'}
          onChange={(e) => store.set({ selectedValue: e.target.value })}
          value="d"
          color="default"
          name="radio-button-demo"
          aria-label="D"
        />
      </div>
      <div>
        <RadioGroup
          label="Radio group"
          helperText="Group of radio"
          name="radio-group-demo"
          controls={[
            { label: 'Brandon' },
            { label: 'Johnson' },
            { label: 'Jack' },
          ]}
        />
      </div>
    </div>
  ))
  .add('Selects', () => (
    <div>
      <State store={store}>
        <Select
          native
          inputProps={{
            name: 'age',
            id: 'age-native-simple',
          }}
          label="Your age"
          helperText="required"
        >
          <option value="" />
          <option value={10}>Ten</option>
          <option value={20}>Twenty</option>
          <option value={30}>Thirty</option>
        </Select>
      </State>
    </div>
  ));
