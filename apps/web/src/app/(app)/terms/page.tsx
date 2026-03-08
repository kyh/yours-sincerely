import type { Metadata } from "next";
import Link from "next/link";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

export const metadata: Metadata = {
  title: "Terms of Use",
};

const Page = () => (
  <>
    <PageHeader title="Terms of Use" />
    <PageContent className="prose dark:prose-invert">
      <p className="text-xs">Last Updated: February 2, 2025</p>
      <h4>Acceptance of Terms</h4>
      <p>
        By accessing or using Yours Sincerely ("the Service"), you agree to be
        bound by these Terms of Use. If you disagree with any part of these
        terms, you may not access the Service.
      </p>

      <h4>Account Registration</h4>
      <ul>
        <li>This service allows anonymous registration</li>
        <li>
          Please only enter in data you are willing to be shared with other
          users of the Service
        </li>
      </ul>

      <h4>User Conduct</h4>
      <p>You agree NOT to:</p>
      <ul>
        <li>Post illegal, harmful, or offensive content</li>
        <li>Impersonate others</li>
        <li>Spam or harass users</li>
        <li>Attempt to hack or disrupt the service</li>
        <li>Use the service for commercial purposes without authorization</li>
        <li>Share explicit or inappropriate content</li>
        <li>Violate others' intellectual property rights</li>
      </ul>

      <h4>Content</h4>
      <p>User Content:</p>
      <ul>
        <li>You retain ownership of your content</li>
        <li>You grant us a license to use, modify, and display your content</li>
        <li>You are responsible for your content</li>
        <li>We can remove content at our discretion</li>
      </ul>
      <p>Content must not:</p>
      <ul>
        <li>Violate laws or regulations</li>
        <li>Infringe on others' rights</li>
        <li>Contain malware or viruses</li>
        <li>Include hate speech or discrimination</li>
        <li>Promote illegal activities</li>
      </ul>

      <h4>Intellectual Property</h4>
      <ul>
        <li>The Service's branding, design, and features are our property</li>
        <li>
          You may not copy or modify our intellectual property without
          permission
        </li>
        <li>
          We respect others' intellectual property rights and expect users to do
          the same
        </li>
      </ul>

      <h4>Privacy</h4>
      <p>
        Your use of the Service is also governed by our Privacy Policy. Please
        review it <Link href="/privacy">here</Link>.
      </p>

      <h4>Termination</h4>
      <ul>
        <li>We may suspend or terminate your account for violations</li>
        <li>You may terminate your account at any time</li>
        <li>Some terms survive account termination</li>
      </ul>

      <h4>Disclaimers</h4>
      <p>
        THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, WHETHER
        EXPRESS OR IMPLIED.
      </p>

      <h4>Limitation of Liability</h4>
      <p>
        We shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages.
      </p>

      <h4>Indemnification</h4>
      <p>
        You agree to indemnify and hold us harmless from any claims resulting
        from your use of the Service.
      </p>

      <h4>Changes to Terms</h4>
      <p>
        We reserve the right to modify these terms at any time. We will notify
        users of any material changes.
      </p>

      <h4>Dispute Resolution</h4>
      <ul>
        <li>Attempt to resolve disputes informally first</li>
        <li>Mandatory arbitration for unresolved disputes</li>
        <li>Class action waiver</li>
        <li>Small claims court option preserved</li>
      </ul>

      <h4>Severability</h4>
      <p>
        If any provision of these terms is found to be unenforceable, the
        remaining provisions will remain in effect.
      </p>

      <h4>Contact Information</h4>
      <p>
        For any questions about these Terms, please contact us at:{" "}
        <a href="mailto:kai@kyh.io?subject=Privacy" target="_blank">
          kai@kyh.io
        </a>
      </p>
    </PageContent>
  </>
);

export default Page;
