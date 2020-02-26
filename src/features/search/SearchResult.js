import React from 'react';
import { Link } from 'react-router-dom';

export const SearchResult = ({ hit }) => (
  <Link to={`/${hit.id}`}>{hit.title}</Link>
);
