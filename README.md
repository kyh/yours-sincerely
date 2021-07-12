[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/kyh/yours-sincerely/issues)
[![Dependencies Status](https://david-dm.org/kyh/yours-sincerely/status.svg)](https://david-dm.org/kyh/yours-sincerely)

# Yours Sincerely

[App Store](https://apps.apple.com/ag/app/yours-sincerely/id1510472230) | [Play Store](https://play.google.com/store/apps/details?id=com.kyh.yourssincerely) | [Website](https://yourssincerely.org/)

> Write as if your arms are wide open, and hold them far apart. An ephemeral anonymous blog to send each other tiny beautiful letters

## 👉 Get Started

This repository is a monorepo managed through [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces).

```
├── /web                         # Next.js web client
|   └── /src
│       ├── /components          # Shared React components
│       ├── /pages               # App routes
│       └── /util                # Utility modules
├── /scripts                     # Migration scripts
├── /functions                   # Firebase functions
└── /native                      # iOS/Android clients
```

### Install dependencies

```
npm install
```

### Run the development server

```
npm run dev
```

When the above command completes you'll be able to view your website at `http://localhost:3000`

## 🥞 Stack

This project uses the following libraries and services:

- Framework - [Next.js](https://nextjs.org)
- Authentication - [Firebase Auth](https://firebase.google.com/products/auth)
- Database - [Cloud Firestore](https://firebase.google.com/products/firestore)
- Payments - [Stripe](https://stripe.com)
- Contact Form - [Google Sheets](https://www.google.com/sheets/about/)
- Analytics - [Google Analytics](https://googleanalytics.com)
- Hosting - [Vercel](https://vercel.com)

## 📚 Guide

<details>
<summary><b>Routing</b></summary>
<p>
  This project uses the built-in Next.js router and its convenient <code>useRouter</code> hook. Learn more in the <a target="_blank" href="https://github.com/zeit/next.js/#routing">Next.js docs</a>.

```js
import Link from "next/link";
import { useRouter } from "next/router";

function MyComponent() {
  // Get the router object
  const router = useRouter();

  // Get value from query string (?postId=123) or route param (/:postId)
  console.log(router.query.postId);

  // Get current pathname
  console.log(router.pathname);

  // Navigate with the <Link> component or with router.push()
  return (
    <div>
      <Link href="/about">
        <a>About</a>
      </Link>
      <button onClick={(e) => router.push("/about")}>About</button>
    </div>
  );
}
```

</p>
</details>

<details>
<summary><b>Authentication</b></summary>
<p>
  This project uses <a href="https://firebase.google.com">Firebase Auth</a> and includes a convenient <code>useAuth</code> hook (located in <code><a href="src/util/auth.js">src/util/auth.js</a></code>) that wraps Firebase and gives you common authentication methods. Depending on your needs you may want to edit this file and expose more Firebase functionality.

```js
import { useAuth } from "util/auth.js";

function MyComponent() {
  // Get the auth object in any component
  const auth = useAuth();

  // Depending on auth state show signin or signout button
  // auth.user will either be an object, null when loading, or false if signed out
  return (
    <div>
      {auth.user ? (
        <button onClick={(e) => auth.signout()}>Signout</button>
      ) : (
        <button onClick={(e) => auth.signin("hello@divjoy.com", "yolo")}>
          Signin
        </button>
      )}
    </div>
  );
}
```

</p>
</details>

<details>
<summary><b>Database</b></summary>
<p>
  This project uses <a href="https://firebase.google.com/products/firestore">Cloud Firestore</a> and includes some data fetching hooks to get you started (located in <code><a href="src/util/db.js">src/util/db.js</a></code>). You'll want to edit that file and add any additional query hooks you need for your project.

```js
import { useAuth } from 'util/auth.js';
import { useItems } from 'util/db.js';
import ItemsList from './ItemsList.js';

function ItemsPage(){
  const auth = useAuth();

  // Fetch items by owner
  // Returned status value will be "idle" if we're waiting on
  // the uid value or "loading" if the query is executing.
  const uid = auth.user ? auth.user.uid : undefined;
  const { data: items, status } = useItems(uid);

  // Once we have items data render ItemsList component
  return (
    <div>
      {(status === "idle" || status === "loading") ? (
        <span>One moment please</span>
      ) : (
        <ItemsList data={items}>
      )}
    </div>
  );
}
```

</p>
</details>
