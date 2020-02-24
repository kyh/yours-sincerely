// the main routes of our app are defined here using react-router
// https://reacttraining.com/react-router/web/example/basic

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import Layout from './layout/Layout';

import PostList from './posts/PostList';
import Post from './posts/Post';
import PostNew from './posts/PostNew';
import PostEdit from './posts/PostEdit';
import Account from './account/Account';
import Login from './account/Login';
import Error from './misc/Error';

const Routes = () => (
  <Switch>
    <Route exact path="/">
      <Layout>
        <PostList />
      </Layout>
    </Route>
    <Route path="/new">
      <PostNew />
    </Route>
    <Route path="/profile">
      <Layout>
        <Account />
      </Layout>
    </Route>
    <Route path="/login">
      <Login />
    </Route>
    <Route path="/:slug/edit">
      <PostEdit />
    </Route>
    <Route path="/:slug">
      <Post />
    </Route>
    <Route>
      <Error />
    </Route>
  </Switch>
);

export default Routes;
