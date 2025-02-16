import type { Metadata } from "next";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

const Page = () => (
  <>
    <PageHeader title="Privacy Policy" />
    <PageContent className="prose dark:prose-invert">
      <p className="text-xs">Last Updated: February 2, 2025</p>
      <h4>Introduction</h4>
      <p>
        Kaiyu Hsu built the Yours Sincerely app as an{" "}
        <a href="https://github.com/kyh/yours-sincerely" target="_blank">
          Open Source
        </a>{" "}
        app. This Service is provided by Kaiyu Hsu at no cost and is intended
        for use as is.
      </p>
      <p>
        This Privacy Policy explains how we collect, use, disclose, and
        safeguard your information when you use our application and related
        services.
      </p>

      <h4>Information We Collect</h4>
      <p>Information You Provide:</p>
      <ul>
        <li>Account information (name, email address, phone number)</li>
        <li>Content you create, share, or upload</li>
        <li>Communications with other users</li>
        <li>Survey responses and feedback</li>
      </ul>
      <p>Automatically Collected Information:</p>
      <ul>
        <li>Usage data (interaction with features, time spent on app)</li>
        <li>Log data (IP address, browser type, access times)</li>
        <li>Cookies and similar tracking technologies</li>
      </ul>

      <h4>How We Use Your Information</h4>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and maintain our services</li>
        <li>Personalize your experience</li>
        <li>Process your transactions</li>
        <li>Send notifications and updates</li>
        <li>Detect and prevent fraud or abuse</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h4>Information Sharing and Disclosure</h4>
      <p>We may share your information with:</p>
      <ul>
        <li>Other users (based on your privacy settings)</li>
        <li>Legal authorities (when required by law)</li>
        <li>Third parties in connection with a business transfer</li>
        <li>Other parties with your consent</li>
      </ul>

      <h4>Data Security</h4>
      <p>
        We implement appropriate technical and organizational measures to
        protect your personal information against unauthorized access,
        alteration, disclosure, or destruction.
      </p>

      <h4>Your Rights and Choices</h4>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal information</li>
        <li>Correct inaccurate data</li>
        <li>Delete your account and data</li>
        <li>Adjust privacy settings</li>
        <li>Export your data</li>
      </ul>

      <h4>Children's Privacy</h4>
      <p>
        Our services are not intended for users under the age of 13. We do not
        knowingly collect information from children under 13 years of age.
      </p>

      <h4>Changes to This Privacy Policy</h4>
      <p>
        We may update this Privacy Policy from time to time. We will notify you
        of any material changes through the app or via email.
      </p>

      <h4>Contact Us</h4>
      <p>
        If you have questions about this Privacy Policy or our practices, please
        contact us at:{" "}
        <a href="mailto:kai@kyh.io?subject=Privacy" target="_blank">
          kai@kyh.io
        </a>
      </p>

      <h4>Cookie Policy</h4>
      <p>
        We use cookies and similar tracking technologies to enhance your
        experience. You can control cookie settings through your browser
        preferences.
      </p>

      <h4>Third-Party Links</h4>
      <p>
        Our app may contain links to third-party websites or services. We are
        not responsible for their privacy practices.
      </p>

      <h4>Data Retention</h4>
      <p>
        We retain your information for as long as necessary to provide our
        services and comply with legal obligations. You may request deletion of
        your data at any time.
      </p>
    </PageContent>
  </>
);

export default Page;
