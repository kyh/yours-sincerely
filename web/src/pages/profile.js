import Head from "next/head";
import ContentLoader from "react-content-loader";
import { PageLayout, PageContent } from "components/Page";
import { Profile } from "components/Profile";
import { NoProfile } from "components/NoProfile";
import { useAuth } from "actions/auth";

const ProfilePage = () => {
  const { user } = useAuth();
  return (
    <>
      <Head>
        <title>Yours Sincerely | Profile</title>
      </Head>
      <PageContent>
        {user === null && <ProfileLoader />}
        {user === false && <NoProfile />}
        {!!user && <Profile />}
      </PageContent>
    </>
  );
};

ProfilePage.Layout = PageLayout;

const ProfileLoader = () => (
  <ContentLoader uniqueKey="profile-loader" height={300} width="100%" speed={3}>
    <rect x="0" y="0" width="50%" height="225" rx="4" ry="4" />
    <rect x="55%" y="0" width="45%" height="40" rx="4" ry="4" />
    <rect x="55%" y="50" width="35%" height="25" rx="4" ry="4" />
  </ContentLoader>
);

export default ProfilePage;
