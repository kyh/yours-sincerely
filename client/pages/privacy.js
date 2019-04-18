/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';
import PropTypes from 'prop-types';
import { Header, Text, Link } from '@components';
import { withStyles } from '@material-ui/core/styles';
import Navigation from '@client/containers/auth/Navigation';

const styles = (theme) => ({
  page: {},
  pageContainer: {
    padding: theme.spacing.unit * 3,
    maxWidth: theme.brand.maxWidth,
    margin: 'auto',
  },
  header: {
    marginBottom: theme.spacing.unit * 4,
  },
  section: {
    marginBottom: theme.spacing.unit * 3,
  },
});

function Privacy(props) {
  const { classes } = props;

  return (
    <main className={classes.page}>
      <Navigation />
      <section className={classes.pageContainer}>
        <header className={classes.header}>
          <Header component="h1" variant="h3">
            Privacy Policy
          </Header>
          <Text variant="subtitle1" gutterBottom>
            Effective date: April 15, 2019
          </Text>
        </header>
        <section className={classes.section}>
          <Text gutterBottom>
            Yours Sincerely ("us", "we", or "our") operates the
            https://yourssincerely.org website and the Yours Sincerely mobile
            application (the "Service").
          </Text>
          <Text gutterBottom>
            This page informs you of our policies regarding the collection, use,
            and disclosure of personal data when you use our Service and the
            choices you have associated with that data. Our Privacy Policy for
            Yours Sincerely is created with the help of the{' '}
            <Link href="https://www.freeprivacypolicy.com/free-privacy-policy-generator.php">
              Free Privacy Policy Generator
            </Link>
            .
          </Text>
          <Text gutterBottom>
            We use your data to provide and improve the Service. By using the
            Service, you agree to the collection and use of information in
            accordance with this policy. Unless otherwise defined in this
            Privacy Policy, terms used in this Privacy Policy have the same
            meanings as in our Terms and Conditions.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Information Collection And Use
          </Header>
          <Text gutterBottom>
            We collect several different types of information for various
            purposes to provide and improve our Service to you.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5" gutterBottom>
            Types of Data Collected
          </Header>
          <section className={classes.section}>
            <Header component="h4" variant="h6" gutterBottom>
              Personal Data
            </Header>
            <Text gutterBottom>
              While using our Service, we may ask you to provide us with certain
              personally identifiable information that can be used to contact or
              identify you ("Personal Data"). Personally identifiable
              information may include, but is not limited to:
            </Text>
            <ul>
              <li>
                <Text variant="caption" gutterBottom>
                  Email address
                </Text>
              </li>
              <li>
                <Text variant="caption" gutterBottom>
                  Cookies and Usage Data
                </Text>
              </li>
            </ul>
          </section>
          <section className={classes.section}>
            <Header component="h4" variant="h6" gutterBottom>
              Usage Data
            </Header>
            <Text gutterBottom>
              We may also collect information that your browser sends whenever
              you visit our Service or when you access the Service by or through
              a mobile device ("Usage Data").
            </Text>
            <Text gutterBottom>
              This Usage Data may include information such as your computer's
              Internet Protocol address (e.g. IP address), browser type, browser
              version, the pages of our Service that you visit, the time and
              date of your visit, the time spent on those pages, unique device
              identifiers and other diagnostic data.
            </Text>
            <Text gutterBottom>
              When you access the Service by or through a mobile device, this
              Usage Data may include information such as the type of mobile
              device you use, your mobile device unique ID, the IP address of
              your mobile device, your mobile operating system, the type of
              mobile Internet browser you use, unique device identifiers and
              other diagnostic data.
            </Text>
          </section>
          <section className={classes.section}>
            <Header component="h4" variant="h6">
              Tracking & Cookies Data
            </Header>
            <Text gutterBottom>
              We use cookies and similar tracking technologies to track the
              activity on our Service and hold certain information.
            </Text>
            <Text gutterBottom>
              Cookies are files with small amount of data which may include an
              anonymous unique identifier. Cookies are sent to your browser from
              a website and stored on your device. Tracking technologies also
              used are beacons, tags, and scripts to collect and track
              information and to improve and analyze our Service.
            </Text>
            <Text gutterBottom>
              You can instruct your browser to refuse all cookies or to indicate
              when a cookie is being sent. However, if you do not accept
              cookies, you may not be able to use some portions of our Service.
            </Text>
            <Text gutterBottom>Examples of Cookies we use:</Text>
            <ul>
              <li>
                <Text variant="caption" gutterBottom>
                  <strong>Session Cookies.</strong> We use Session Cookies to
                  operate our Service.
                </Text>
              </li>
              <li>
                <Text variant="caption" gutterBottom>
                  <strong>Preference Cookies.</strong> We use Preference Cookies
                  to remember your preferences and various settings.
                </Text>
              </li>
              <li>
                <Text variant="caption" gutterBottom>
                  <strong>Security Cookies.</strong> We use Security Cookies for
                  security purposes.
                </Text>
              </li>
            </ul>
          </section>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Use of Data
          </Header>
          <Text gutterBottom>
            Yours Sincerely uses the collected data for various purposes:
          </Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                To provide and maintain the Service
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To notify you about changes to our Service
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To allow you to participate in interactive features of our
                Service when you choose to do so
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To provide customer care and support
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To provide analysis or valuable information so that we can
                improve the Service
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To monitor the usage of the Service
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To detect, prevent and address technical issues
              </Text>
            </li>
          </ul>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Transfer Of Data
          </Header>
          <Text gutterBottom>
            Your information, including Personal Data, may be transferred to —
            and maintained on — computers located outside of your state,
            province, country or other governmental jurisdiction where the data
            protection laws may differ than those from your jurisdiction.
          </Text>
          <Text gutterBottom>
            If you are located outside United States and choose to provide
            information to us, please note that we transfer the data, including
            Personal Data, to United States and process it there.
          </Text>
          <Text gutterBottom>
            Your consent to this Privacy Policy followed by your submission of
            such information represents your agreement to that transfer.
          </Text>
          <Text gutterBottom>
            Yours Sincerely will take all steps reasonably necessary to ensure
            that your data is treated securely and in accordance with this
            Privacy Policy and no transfer of your Personal Data will take place
            to an organization or a country unless there are adequate controls
            in place including the security of your data and other personal
            information.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Disclosure Of Data
          </Header>
          <Header component="h3" variant="h5">
            Legal Requirements
          </Header>
          <Text gutterBottom>
            Yours Sincerely may disclose your Personal Data in the good faith
            belief that such action is necessary to:
          </Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                To comply with a legal obligation
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To protect and defend the rights or property of Yours Sincerely
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To prevent or investigate possible wrongdoing in connection with
                the Service
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To protect the personal safety of users of the Service or the
                public
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                To protect against legal liability
              </Text>
            </li>
          </ul>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Security Of Data
          </Header>
          <Text gutterBottom>
            The security of your data is important to us, but remember that no
            method of transmission over the Internet, or method of electronic
            storage is 100% secure. While we strive to use commercially
            acceptable means to protect your Personal Data, we cannot guarantee
            its absolute security.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Service Providers
          </Header>
          <Text gutterBottom>
            We may employ third party companies and individuals to facilitate
            our Service ("Service Providers"), to provide the Service on our
            behalf, to perform Service-related services or to assist us in
            analyzing how our Service is used.
          </Text>
          <Text gutterBottom>
            These third parties have access to your Personal Data only to
            perform these tasks on our behalf and are obligated not to disclose
            or use it for any other purpose.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            Analytics
          </Header>
          <Text gutterBottom>
            We may use third-party Service Providers to monitor and analyze the
            use of our Service.
          </Text>
          <ul>
            <li>
              <Text gutterBottom>
                <strong>Google Analytics</strong>
              </Text>
              <Text gutterBottom>
                Google Analytics is a web analytics service offered by Google
                that tracks and reports website traffic. Google uses the data
                collected to track and monitor the use of our Service. This data
                is shared with other Google services. Google may use the
                collected data to contextualize and personalize the ads of its
                own advertising network.
              </Text>
              <Text gutterBottom>
                For more information on the privacy practices of Google, please
                visit the Google Privacy & Terms web page:{' '}
                <Link href="https://policies.google.com/privacy?hl=en">
                  https://policies.google.com/privacy?hl=en
                </Link>
              </Text>
            </li>
            <li>
              <Text gutterBottom>
                <strong>Firebase</strong>
              </Text>
              <Text gutterBottom>
                Firebase is analytics service provided by Google Inc.
              </Text>
              <Text gutterBottom>
                You may opt-out of certain Firebase features through your mobile
                device settings, such as your device advertising settings or by
                following the instructions provided by Google in their Privacy
                Policy:{' '}
                <Link href="https://policies.google.com/privacy?hl=en">
                  https://policies.google.com/privacy?hl=en
                </Link>
              </Text>
              <Text gutterBottom>
                We also encourage you to review the Google's policy for
                safeguarding your data:{' '}
                <Link href="https://support.google.com/analytics/answer/6004245">
                  https://support.google.com/analytics/answer/6004245
                </Link>
                . For more information on what type of information Firebase
                collects, please visit please visit the Google Privacy & Terms
                web page:{' '}
                <Link href="https://policies.google.com/privacy?hl=en">
                  https://policies.google.com/privacy?hl=en
                </Link>
              </Text>
            </li>
            <li>
              <Text gutterBottom>
                <strong>Mixpanel</strong>
              </Text>
              <Text gutterBottom>Mixpanel is provided by Mixpanel Inc</Text>
              <Text gutterBottom>
                You can prevent Mixpanel from using your information for
                analytics purposes by opting-out. To opt-out of Mixpanel
                service, please visit this page:{' '}
                <Link href="https://mixpanel.com/optout/">
                  https://mixpanel.com/optout/
                </Link>
              </Text>
              <Text gutterBottom>
                For more information on what type of information Mixpanel
                collects, please visit the Terms of Use page of Mixpanel:{' '}
                <Link href="https://mixpanel.com/terms/">
                  https://mixpanel.com/terms/
                </Link>
              </Text>
            </li>
          </ul>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Links To Other Sites
          </Header>
          <Text gutterBottom>
            Our Service may contain links to other sites that are not operated
            by us. If you click on a third party link, you will be directed to
            that third party's site. We strongly advise you to review the
            Privacy Policy of every site you visit.
          </Text>
          <Text gutterBottom>
            We have no control over and assume no responsibility for the
            content, privacy policies or practices of any third party sites or
            services.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Children's Privacy
          </Header>
          <Text gutterBottom>
            Our Service does not address anyone under the age of 18
            ("Children").
          </Text>
          <Text gutterBottom>
            We do not knowingly collect personally identifiable information from
            anyone under the age of 18. If you are a parent or guardian and you
            are aware that your Children has provided us with Personal Data,
            please contact us. If we become aware that we have collected
            Personal Data from children without verification of parental
            consent, we take steps to remove that information from our servers.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Changes To This Privacy Policy
          </Header>
          <Text gutterBottom>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
          </Text>
          <Text gutterBottom>
            We will let you know via email and/or a prominent notice on our
            Service, prior to the change becoming effective and update the
            "effective date" at the top of this Privacy Policy.
          </Text>
          <Text gutterBottom>
            You are advised to review this Privacy Policy periodically for any
            changes. Changes to this Privacy Policy are effective when they are
            posted on this page.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h2" variant="h4">
            Contact Us
          </Header>
          <Text gutterBottom>
            If you have any questions about this Privacy Policy, please contact
            us:
          </Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                By visiting this page on our website:
                https://yourssincerely.org/privacy
              </Text>
            </li>
          </ul>
        </section>
      </section>
    </main>
  );
}

Privacy.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Privacy);
