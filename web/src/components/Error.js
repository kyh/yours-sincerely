import React from "react";
import Link from "next/link";

export const Error = ({ error }) => (
  <div>
    <h1>Whoops</h1>
    <p>Sorry, something went wrong. We're looking into it.</p>
    <div style={{ fontFamily: "monospace" }}>
      {error ? error.message : null}
    </div>
    <Link href="/">
      <a>Go to the homepage</a>
    </Link>
  </div>
);
