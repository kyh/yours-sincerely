import React from "react";
import { Switch, Route } from "react-router-dom";
import { PageLayout } from "components/Page";

import { PostList } from "./posts/PostList";
import { Post } from "./posts/Post";
import { PostNew } from "./posts/PostNew";
import { PostEdit } from "./posts/PostEdit";
import { ProfilePage } from "./profile/ProfilePage";
import { AboutPage } from "./about/AboutPage";
import { PrivacyPage } from "./about/PrivacyPage";
import { TermsPage } from "./about/TermsPage";
import { Error } from "./misc/Error";

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
        <ProfilePage />
      </PageLayout>
    </Route>
    <Route path="/about">
      <PageLayout>
        <AboutPage />
      </PageLayout>
    </Route>
    <Route path="/privacy">
      <PageLayout>
        <PrivacyPage />
      </PageLayout>
    </Route>
    <Route path="/terms">
      <PageLayout>
        <TermsPage />
      </PageLayout>
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
