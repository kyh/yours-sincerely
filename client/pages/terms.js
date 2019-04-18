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

function Terms(props) {
  const { classes } = props;

  return (
    <main className={classes.page}>
      <Navigation />
      <section className={classes.pageContainer}>
        <header className={classes.header}>
          <Header component="h1" variant="h3">
            Terms and Conditions
          </Header>
          <Text variant="subtitle1" gutterBottom>
            Effective date: April 15, 2019
          </Text>
        </header>
        <section className={classes.section}>
          <Header component="h2" variant="h5">
            Welcome to Yours Sincerely
          </Header>
          <Text gutterBottom>
            These terms and conditions outline the rules and regulations for the
            use of Yours Sincerely's Website, located at
            https://yourssincerely.org.
          </Text>
          <Text gutterBottom>
            By accessing this website we assume you accept these terms and
            conditions. Do not continue to use Yours Sincerely if you do not
            agree to take all of the terms and conditions stated on this page.
            Our Terms and Conditions were created with the help of the{' '}
            <Link href="https://termsandconditionsgenerator.com">
              Terms And Conditions Generator
            </Link>
            .
          </Text>
        </section>
        <section className={classes.section}>
          <Text gutterBottom>
            The following terminology applies to these Terms and Conditions,
            Privacy Statement and Disclaimer Notice and all Agreements:
            "Client", "You" and "Your" refers to you, the person log on this
            website and compliant to the Company’s terms and conditions. "The
            Company", "Ourselves", "We", "Our" and "Us", refers to our Company.
            "Party", "Parties", or "Us", refers to both the Client and
            ourselves. All terms refer to the offer, acceptance and
            consideration of payment necessary to undertake the process of our
            assistance to the Client in the most appropriate manner for the
            express purpose of meeting the Client’s needs in respect of
            provision of the Company’s stated services, in accordance with and
            subject to, prevailing law of Netherlands. Any use of the above
            terminology or other words in the singular, plural, capitalization
            and/or he/she or they, are taken as interchangeable and therefore as
            referring to same.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>Cookies</strong>
          </Header>
          <Text gutterBottom>
            We employ the use of cookies. By accessing Yours Sincerely, you
            agreed to use cookies in agreement with the Yours Sincerely's
            Privacy Policy.
          </Text>
          <Text gutterBottom>
            Most interactive websites use cookies to let us retrieve the user’s
            details for each visit. Cookies are used by our website to enable
            the functionality of certain areas to make it easier for people
            visiting our website. Some of our affiliate/advertising partners may
            also use cookies.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>License</strong>
          </Header>
          <Text gutterBottom>
            Unless otherwise stated, Yours Sincerely and/or its licensors own
            the intellectual property rights for all material on Yours
            Sincerely. All intellectual property rights are reserved. You may
            access this from Yours Sincerely for your own personal use subjected
            to restrictions set in these terms and conditions.
          </Text>
          <Text gutterBottom>You must not:</Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                Republish material from Yours Sincerely
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                Sell, rent or sub-license material from Yours Sincerely
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                Reproduce, duplicate or copy material from Yours Sincerely
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                Redistribute content from Yours Sincerely
              </Text>
            </li>
          </ul>
          <Text gutterBottom>
            This Agreement shall begin on the date hereof.
          </Text>
          <Text gutterBottom>
            Parts of this website offer an opportunity for users to post and
            exchange opinions and information in certain areas of the website.
            Yours Sincerely does not filter, edit, publish or review Comments
            prior to their presence on the website. Comments do not reflect the
            views and opinions of Yours Sincerely,its agents and/or affiliates.
            Comments reflect the views and opinions of the person who post their
            views and opinions. To the extent permitted by applicable laws,
            Yours Sincerely shall not be liable for the Comments or for any
            liability, damages or expenses caused and/or suffered as a result of
            any use of and/or posting of and/or appearance of the Comments on
            this website.
          </Text>
          <Text gutterBottom>
            Yours Sincerely reserves the right to monitor all Comments and to
            remove any Comments which can be considered inappropriate, offensive
            or causes breach of these Terms and Conditions.
          </Text>
          <Text gutterBottom>You warrant and represent that:</Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                You are entitled to post the Comments on our website and have
                all necessary licenses and consents to do so;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                The Comments do not invade any intellectual property right,
                including without limitation copyright, patent or trademark of
                any third party;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                The Comments do not contain any defamatory, libelous, offensive,
                indecent or otherwise unlawful material which is an invasion of
                privacy
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                The Comments will not be used to solicit or promote business or
                custom or present commercial activities or unlawful activity.
              </Text>
            </li>
          </ul>
          <Text gutterBottom>
            You hereby grant Yours Sincerely a non-exclusive license to use,
            reproduce, edit and authorize others to use, reproduce and edit any
            of your Comments in any and all forms, formats or media.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>Hyperlinking to our Content</strong>
          </Header>
          <Text gutterBottom>
            The following organizations may link to our Website without prior
            written approval:
          </Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                Government agencies;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                Search engines;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                News organizations;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                Online directory distributors may link to our Website in the
                same manner as they hyperlink to the Websites of other listed
                businesses; and
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                System wide Accredited Businesses except soliciting non-profit
                organizations, charity shopping malls, and charity fundraising
                groups which may not hyperlink to our Web site.
              </Text>
            </li>
          </ul>
          <Text gutterBottom>
            These organizations may link to our home page, to publications or to
            other Website information so long as the link: (a) is not in any way
            deceptive; (b) does not falsely imply sponsorship, endorsement or
            approval of the linking party and its products and/or services; and
            (c) fits within the context of the linking party’s site.
          </Text>
          <Text gutterBottom>
            We may consider and approve other link requests from the following
            types of organizations:
          </Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                commonly-known consumer and/or business information sources;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                dot.com community sites;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                associations or other groups representing charities;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                online directory distributors;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                internet portals;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                accounting, law and consulting firms; and
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                educational institutions and trade associations.
              </Text>
            </li>
          </ul>
          <Text gutterBottom>
            We will approve link requests from these organizations if we decide
            that: (a) the link would not make us look unfavorably to ourselves
            or to our accredited businesses; (b) the organization does not have
            any negative records with us; (c) the benefit to us from the
            visibility of the hyperlink compensates the absence of Yours
            Sincerely; and (d) the link is in the context of general resource
            information.
          </Text>
          <Text gutterBottom>
            These organizations may link to our home page so long as the link:
            (a) is not in any way deceptive; (b) does not falsely imply
            sponsorship, endorsement or approval of the linking party and its
            products or services; and (c) fits within the context of the linking
            party’s site.
          </Text>
          <Text gutterBottom>
            If you are one of the organizations listed in paragraph 2 above and
            are interested in linking to our website, you must inform us by
            sending an e-mail to Yours Sincerely. Please include your name, your
            organization name, contact information as well as the URL of your
            site, a list of any URLs from which you intend to link to our
            Website, and a list of the URLs on our site to which you would like
            to link. Wait 2-3 weeks for a response.
          </Text>
          <Text gutterBottom>
            Approved organizations may hyperlink to our Website as follows:
          </Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                By use of our corporate name; or
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                By use of the uniform resource locator being linked to; or
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                By use of any other description of our Website being linked to
                that makes sense within the context and format of content on the
                linking party’s site.
              </Text>
            </li>
          </ul>
          <Text gutterBottom>
            No use of Yours Sincerely's logo or other artwork will be allowed
            for linking absent a trademark license agreement.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>iFrames</strong>
          </Header>
          <Text gutterBottom>
            Without prior approval and written permission, you may not create
            frames around our Webpages that alter in any way the visual
            presentation or appearance of our Website.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>Content Liability</strong>
          </Header>
          <Text gutterBottom>
            We shall not be hold responsible for any content that appears on
            your Website. You agree to protect and defend us against all claims
            that is rising on your Website. No link(s) should appear on any
            Website that may be interpreted as libelous, obscene or criminal, or
            which infringes, otherwise violates, or advocates the infringement
            or other violation of, any third party rights.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>Your Privacy</strong>
          </Header>
          <Text gutterBottom>
            Please read <Link href="/privacy">privacy policy</Link>
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>Reservation of Rights</strong>
          </Header>
          <Text gutterBottom>
            We reserve the right to request that you remove all links or any
            particular link to our Website. You approve to immediately remove
            all links to our Website upon request. We also reserve the right to
            amen these terms and conditions and it’s linking policy at any time.
            By continuously linking to our Website, you agree to be bound to and
            follow these linking terms and conditions.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>Removal of links from our website</strong>
          </Header>
          <Text gutterBottom>
            If you find any link on our Website that is offensive for any
            reason, you are free to contact and inform us any moment. We will
            consider requests to remove links but we are not obligated to or so
            or to respond to you directly.
          </Text>
          <Text gutterBottom>
            We do not ensure that the information on this website is correct, we
            do not warrant its completeness or accuracy; nor do we promise to
            ensure that the website remains available or that the material on
            the website is kept up to date.
          </Text>
        </section>
        <section className={classes.section}>
          <Header component="h3" variant="h5">
            <strong>Disclaimer</strong>
          </Header>
          <Text gutterBottom>
            To the maximum extent permitted by applicable law, we exclude all
            representations, warranties and conditions relating to our website
            and the use of this website. Nothing in this disclaimer will:
          </Text>
          <ul>
            <li>
              <Text variant="caption" gutterBottom>
                limit or exclude our or your liability for death or personal
                injury;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                limit or exclude our or your liability for fraud or fraudulent
                misrepresentation;
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                limit any of our or your liabilities in any way that is not
                permitted under applicable law; or
              </Text>
            </li>
            <li>
              <Text variant="caption" gutterBottom>
                exclude any of our or your liabilities that may not be excluded
                under applicable law.
              </Text>
            </li>
          </ul>
          <Text gutterBottom>
            The limitations and prohibitions of liability set in this Section
            and elsewhere in this disclaimer: (a) are subject to the preceding
            paragraph; and (b) govern all liabilities arising under the
            disclaimer, including liabilities arising in contract, in tort and
            for breach of statutory duty.
          </Text>
          <Text gutterBottom>
            As long as the website and the information and services on the
            website are provided free of charge, we will not be liable for any
            loss or damage of any nature.
          </Text>
        </section>
      </section>
    </main>
  );
}

Terms.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Terms);
