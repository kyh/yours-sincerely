// a generic error page to show whenever something goes wrong in other views

import React from 'react';
import { Link } from 'react-router-dom';

export const Error = ({ error }) => (
  <div>
    <h1>Whoops</h1>
    <p>{`Sorry, something went wrong. We're looking into it.`}</p>
    <div style={{ fontFamily: 'monospace' }}>
      {error ? error.message : null}
    </div>
    <Link to="/">Go to the homepage</Link>
  </div>
);
