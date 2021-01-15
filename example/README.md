# Getting Started

This section will show you how to create your own YS instance and ship it live.

## Before you begin

Make sure you have git and Node JS installed.

Run `npm i -g firebase-tools` to install the Firebase command line tools. After it installs, run `firebase login`.

## Creating your app

We're going to clone the YS repo onto your computer, create Firebase projects in the Firebase console, and then add keys from the console to your code.

### Get the code

In your terminal, cd to the folder where you want your project to live
Clone this repo by running `git clone https://github.com/kyh/yours-sincerely .` And you can then install your node_modules with `npm i`

### Connect to the database

YS uses multiple `Firebase` projects. Each project has its own URL and its own separate copy of the database. This lets you develop your app without affecting the live version.

Go to the Firebase console and sign in with your Google account
Create two new projects, and name them something like `MyYS Dev` and `MyYS PROD`
Now let's connect our app to the databases by adding the database keys to our app's environment files.

You should not commit keys like this to version control, so first we'll rename our environment files to match the names in our `.gitignore`.

First, rename `.firebaserc.example` to `.firebaserc`
Rename `.env.dev.example` to `.env.dev,` and do the same thing for prod .env files

Now back on the Firebase website, click "Add Firebase to your web app" for each new project

You'll see a block of code with info like "project id" and "API key"—add these values to your `.firebaserc` and your the respective dev and live `.env` files

### Set up your Firebase projects

Before you can add any posts, you'll have to allow sign-in with Google and/or sign-in anonymously. Firebase makes this very easy.

Back in the Firebase console:

- Click on "Authentication" in the sidebar on the left
- Click "Set up sign-in method"
- Click "Google", toggle the "Enable" switch, and hit "Save"

## Running the app

When you're finished setting things up, start your app by running npm start in your terminal. You should see a basic web app appear in your browser!

Try logging in, then make sure you can create and like posts.

Now go back to your text editor and try editing some files. When you save, the changes should automatically appear in the browser without refreshing.

## Going live

First, you'll probably want to buy a domain and connect it to your project on the Firebase console hosting page before going live.

Before going live, secure your app by writing rules in the firestore.rules file.

When it's time to ship, run `npm run deploy`. You just shipped a fully-functional YS app!

🎉 🎉 🎉
