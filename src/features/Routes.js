// the main routes of our app are defined here using react-router
// https://reacttraining.com/react-router/web/example/basic

import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { PageLayout } from 'components/Page';

import { PostList } from './posts/PostList';
import { Post } from './posts/Post';
import { PostNew } from './posts/PostNew';
import { PostEdit } from './posts/PostEdit';
import { Account } from './account/Account';
import { Login } from './account/Login';
import { Error } from './misc/Error';

export const Routes = () => (
  <Switch>
    <Route exact path="/">
      <PageLayout>
        <PostList />
      </PageLayout>
    </Route>
    <Route path="/new">
      <PostNew />
    </Route>
    <Route path="/profile">
      <PageLayout>
        <Account />
      </PageLayout>
    </Route>
    <Route path="/login">
      <Login />
    </Route>
    <Route path="/:postId/edit">
      <PostEdit />
    </Route>
    <Route path="/:postId">
      <PageLayout>
        <Post />
      </PageLayout>
    </Route>
    <Route>
      <Error />
    </Route>
  </Switch>
);
