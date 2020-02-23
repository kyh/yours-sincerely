// lets users search posts using the Algolia API
// https://community.algolia.com/react-instantsearch/Getting_started.html#install-react-instantsearch

import React from 'react';
import { InstantSearch, Hits, SearchBox } from 'react-instantsearch-dom';

import SearchStyles from 'styles/search';
import { Page } from 'styles/layout';

import SearchResult from './SearchResult';

const Search = () => (
  <Page>
    <SearchStyles />
    <InstantSearch
      appId={process.env.REACT_APP_ALGOLIA_APP_ID}
      apiKey={process.env.REACT_APP_ALGOLIA_SEARCH_KEY}
      indexName="posts"
    >
      <SearchBox autofocus />
      <Hits hitComponent={SearchResult} />
    </InstantSearch>
  </Page>
);

export default Search;
