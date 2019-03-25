import React from 'react';
import ContentLoader from 'react-content-loader';

function FeedContentLoader(props) {
  return (
    <ContentLoader
      height={160}
      width={400}
      speed={2}
      primaryColor="#f3f3f3"
      secondaryColor="#ecebeb"
      {...props}
    >
      <rect x="0" y="0" width="400" height="12" />
      <rect x="0" y="20" width="400" height="12" />
      <rect x="0" y="40" width="400" height="12" />
      <rect x="0" y="60" width="400" height="12" />
      <rect x="0" y="80" width="400" height="12" />
      <rect x="0" y="100" width="400" height="12" />
      <rect x="0" y="120" width="400" height="12" />
    </ContentLoader>
  );
}

export default FeedContentLoader;
