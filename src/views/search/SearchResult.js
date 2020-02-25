import React from 'react';
import { Link } from 'react-router-dom';

const SearchResult = ({ hit }) => <Link to={`/${hit.id}`}>{hit.title}</Link>;

export default SearchResult;
