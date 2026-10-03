import { BROWSER_COOKIE_MAX_AGE_SECONDS } from "@repo/contracts/auth";
import { POST_EXPIRY_DAYS } from "@repo/contracts/content";
import { WEB_HOST } from "@repo/contracts/mobile-identity";
import { PUSH_TOKEN_MAX_IDLE_DAYS } from "@repo/contracts/notifications";

import { siteConfig } from "@/lib/site-config";

export type Inline =
  | { kind: "text"; text: string }
  | { kind: "strong"; text: string }
  | { kind: "link"; href: string; label: string };

export type Block =
  | { kind: "paragraph"; content: Inline[] }
  | { kind: "list"; items: Inline[][] }
  | { kind: "table"; head: string[]; rows: string[][] };

export interface Section {
  heading: string;
  blocks: Block[];
}

/** One source for a page's HTML and its Markdown twin, so the two cannot drift. */
export interface ProsePage {
  path: string;
  title: string;
  description: string;
  /** Front matter, before the first section heading. */
  intro?: Block[];
  sections: Section[];
  /** Closing notes, set off from the last section by a divider. */
  footnote?: Block[];
}

/**
 * The id a section heading carries in the HTML, and so the anchor every `#link`
 * names. It is GitHub's heading-anchor rule (lowercase, punctuation dropped, a
 * hyphen per space), so the Markdown twin's links resolve where it is rendered.
 */
export const headingId = (heading: string): string =>
  heading
    .trim()
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}\s_-]/gu, "")
    .replaceAll(/\s/gu, "-");

const t = (text: string): Inline => ({ kind: "text", text });
const b = (text: string): Inline => ({ kind: "strong", text });
const link = (href: string, label: string): Inline => ({ href, kind: "link", label });
const p = (...content: Inline[]): Block => ({ content, kind: "paragraph" });
const list = (...items: string[]): Block => ({
  items: items.map((item) => [t(item)]),
  kind: "list",
});
const richList = (...items: Inline[][]): Block => ({ items, kind: "list" });
const table = (head: string[], ...rows: string[][]): Block => ({ head, kind: "table", rows });
const section = (heading: string, ...blocks: Block[]): Section => ({ blocks, heading });
/** The legal templates' run-in heading: "**Label.** text". */
const labelled = (label: string, ...content: Inline[]): Block => p(b(label), t(" "), ...content);
/** A link to a section of the same page, labelled with its heading. */
const anchor = (heading: string, label = heading): Inline => link(`#${headingId(heading)}`, label);

const email = link(`mailto:${siteConfig.contactEmail}`, siteConfig.contactEmail);
const repo = link(siteConfig.repository, "github.com/kyh/yours-sincerely");
const issues = link(`${siteConfig.repository}/issues`, "GitHub issues");

export const contactPage: ProsePage = {
  description: `How to reach the person who runs ${siteConfig.name}.`,
  path: "/contact",
  sections: [
    {
      blocks: [
        p(
          t(
            `${siteConfig.name} is a small, independent project built and run by ${siteConfig.author.name}. There is no support team or ticket queue — every message is read by the person who wrote the code, so please be patient with replies.`,
          ),
        ),
      ],
      heading: "Who you are talking to",
    },
    {
      blocks: [
        p(t("Email "), email, t(" for anything about the site or the apps:")),
        list(
          "Questions about how the service works, or about your account",
          "Requests to delete letters or data you cannot remove yourself in Settings",
          "Privacy questions, or anything covered by the privacy policy",
          "Press, partnerships, or just saying hello",
        ),
      ],
      heading: "Email",
    },
    {
      blocks: [
        p(
          t(
            "To report a letter that breaks the rules, use the report option on the letter itself — it reaches moderation fastest and keeps the letter's id attached. If a letter puts someone in danger, also email ",
          ),
          email,
          t(" with a link to it."),
        ),
      ],
      heading: "Reporting a letter",
    },
    {
      blocks: [
        p(
          t(
            `${siteConfig.name} is open source. Bugs, feature ideas and code contributions are welcome on `,
          ),
          issues,
          t(". The full source lives at "),
          repo,
          t("."),
        ),
      ],
      heading: "Bugs and code",
    },
  ],
  title: "Contact",
};

/* The Privacy Policy and the Terms of Use follow General Legal's templates
   (privacy-policy-gdpr and terms-of-use, dispute resolution Option A), with each
   bracketed choice resolved to what this code actually does. Change a practice
   in the code and its sentence here in the same commit. */

/** Both documents took their current form on this date. */
const LEGAL_EFFECTIVE_DATE = "October 3, 2026";
/** 1.0 was the hand-written Terms of Use of February 2, 2025. */
const TERMS_VERSION = "2.0";
const SECONDS_PER_DAY = 60 * 60 * 24;
const COOKIE_MAX_AGE_DAYS = BROWSER_COOKIE_MAX_AGE_SECONDS / SECONDS_PER_DAY;
/** The defined term in the templates' all-caps clauses. */
const NAME_CAPS = siteConfig.name.toUpperCase();
/** The terms have always named `supportEmail`, the privacy policy `contactEmail`. */
const termsEmail = link(`mailto:${siteConfig.supportEmail}`, siteConfig.supportEmail);
const privacyPolicyLink = link("/privacy", `${WEB_HOST}/privacy`);

/** General Legal's credit, verbatim: the last paragraph of each legal document. */
const generalLegalCredit = p(
  t(
    'This template was prepared and made publicly available by General Legal, PC ("General Legal"). It is provided for general reference purposes only and does not constitute, and should not be construed as, legal advice, or an endorsement or review of any particular transaction in which it is used. Use of this template does not create an attorney-client relationship with General Legal. General Legal has not reviewed, and takes no position on, any modifications made to this document or the deal terms it is used to document.',
  ),
);

const COLLECT = "Personal information we collect";
const TRACKING = "Tracking & Other Technologies";
const USE = "How we use your personal information";
const RETENTION = "Retention";
const SHARE = "How we share your personal information";
const CHOICES = "Your choices";
const CONTACT_US = "How to contact us";
const STATE_NOTICE = "State privacy rights notice";
const EUROPE_NOTICE = "Notice to European users";

const privacySections: Section[] = [
  section(
    COLLECT,
    labelled(
      "Information you provide to us.",
      t("Personal information you may provide to us through the Service or otherwise includes:"),
    ),
    richList(
      [
        b("Contact data"),
        t(
          ", such as your email address, which you can add to your account to sign in on other devices and to receive password-reset links.",
        ),
      ],
      [
        b("Profile data"),
        t(
          ', such as the password you set when you register an account and the display name you choose. We store only a salted hash of your password, never the password itself. If you write without registering, the Service creates an anonymous account for you the first time you publish, like or report a letter or comment, or block a writer. That account has no email address or password, and its display name is "Anonymous" or the name you signed your first letter with. Your avatar is one of a fixed set of illustrations, picked automatically from your display name.',
        ),
      ],
      [
        b("Communications data"),
        t(
          " based on our exchanges with you, including when you email us, for example through the Support and Report Post links in the Service, which put your account's id or the letter's id in the email's subject line.",
        ),
      ],
      [
        b("User-generated content and input data"),
        t(
          ", such as the letters and comments you publish and the name you sign them with; the likes, reports (when you mark a letter as inappropriate) and blocks you make; and the notifications we keep for you when someone replies to your letter, as well as associated metadata. Metadata includes information on when and by whom a piece of content was created, such as the time you published a letter and the account that published it.",
        ),
      ],
      [
        b("Other data"),
        t(
          " not specifically listed here, which we will use as described in this Privacy Policy or as otherwise disclosed at the time of collection.",
        ),
      ],
    ),
    p(
      t(
        "We never ask for your phone number, real name, postal address or payment details to let you use the Service.",
      ),
    ),
    labelled(
      "Third-party sources.",
      t(
        "We may combine personal information we receive from you with personal information falling within one of the categories identified above that we obtain from other sources, such as:",
      ),
    ),
    richList([
      b("Service providers"),
      t(" that provide services on our behalf or help us operate the Service or our business."),
    ]),
    labelled(
      "Automatic data collection.",
      t(
        "We and our service providers may automatically log information about you, your computer or mobile device, and your interaction over time with the Service, our communications and other online services, such as:",
      ),
    ),
    richList(
      [
        b("Device data"),
        t(
          ", such as your IP address and browser type, which our hosting provider records in standard server logs that we use only to keep the Service running and to stop abuse; the feed layout you chose, which your browser sends us in a cookie; and, if you allow notifications in our mobile apps, your device's push-notification token and whether it is an iOS or Android device.",
        ),
      ],
      [
        b("Online activity data"),
        t(
          ", such as the pages of our website you view and the website that sent you there, which we count with Vercel Web Analytics without cookies and without identifying you.",
        ),
      ],
    ),
    p(
      t("For more information concerning our automatic collection of data, please see the "),
      anchor(TRACKING),
      t(" section below."),
    ),
    labelled(
      "Data about others.",
      t(
        "Letters and comments may mention other people. Please do not share another person's personal information in a letter or comment unless you have their permission to do so.",
      ),
    ),
  ),
  section(
    TRACKING,
    labelled(
      "Cookies and other technologies.",
      t(
        "Some of our automatic data collection is facilitated by cookies and other technologies. Cookies are small data files that a website stores on your device; browser web storage (local storage) works the same way but holds more data. The Service uses only its own (first-party) cookies and storage, in these categories:",
      ),
    ),
    richList(
      [
        b("Essential."),
        t(
          ` A session cookie that we set to keep you signed in, including as an anonymous writer. We do not end sessions after a set time: the cookie lasts up to ${COOKIE_MAX_AGE_DAYS} days, the longest a browser keeps one, and we renew it while you keep using the Service. It is removed when you log out or delete your account, and resetting your password signs your account out on every other device. Our mobile apps keep the same session in your device's secure storage instead of a cookie. If you update to our current app from its earlier version, the app copies the session that version saved on your device into that storage, so you stay signed in, and then deletes the earlier copy; this happens on your device.`,
        ),
      ],
      [
        b("Functionality / performance."),
        t(
          ` A cookie that remembers the feed layout you chose, kept for up to ${COOKIE_MAX_AGE_DAYS} days, and your browser's local storage, which remembers your color theme and keeps drafts of letters and comments you have started but not published. Drafts stay on your device and are not sent to us until you publish them. Our mobile apps keep the same preferences, and a draft letter, in storage on your device.`,
        ),
      ],
      [
        b("Analytics."),
        t(
          " Vercel Web Analytics, provided by our hosting provider, Vercel, counts page views on our website without setting cookies and without identifying you.",
        ),
      ],
    ),
    p(
      t(
        "We do not use advertising or social media cookies, or any technology that tracks you across other websites.",
      ),
    ),
    p(
      t(
        "For information concerning your choices with respect to the use of tracking technologies, see the ",
      ),
      anchor(CHOICES),
      t(" section below."),
    ),
  ),
  section(
    USE,
    p(
      t(
        "We may use your personal information for the following purposes or as otherwise described at the time of collection:",
      ),
    ),
    labelled("Service delivery and operations.", t("We may use your personal information to:")),
    list(
      "provide the Service;",
      "enable security features of the Service;",
      "establish and maintain your user profile on the Service;",
      "facilitate social features of the Service, such as publishing your letters and comments, likes, blocking writers and notifying you when someone replies to your letter;",
      "moderate the Service, for example by automatically hiding a letter that several accounts have marked as inappropriate;",
      "communicate with you about the Service, including by sending Service-related announcements, updates, security alerts, and support and administrative messages, such as password-reset emails; and",
      "provide support for the Service, and respond to your requests, questions and feedback.",
    ),
    p(
      b("Service personalization"),
      t(
        ", which may include using your personal information to remember your selections and preferences as you navigate webpages, such as the feed layout you chose.",
      ),
    ),
    labelled(
      "Service improvement and analytics.",
      t(
        "We may use your personal information to analyze your usage of the Service, improve the Service, help us understand user activity on the Service, including which pages are most and least visited and how visitors move around the Service, and to develop new products and services. For example, we use Vercel Web Analytics for this purpose.",
      ),
    ),
    labelled("Compliance and protection.", t("We may use your personal information to:")),
    richList(
      [
        t(
          "comply with applicable laws, lawful requests, and legal process, such as to respond to subpoenas, investigations or requests from government authorities;",
        ),
      ],
      [
        t(
          "protect our, your or others' rights, privacy, safety or property (including by making and defending legal claims);",
        ),
      ],
      [
        t(
          "audit our internal processes for compliance with legal and contractual requirements or our internal policies;",
        ),
      ],
      [
        t("enforce the terms and conditions that govern the Service, including our "),
        link("/terms", "Terms of Use"),
        t("; and"),
      ],
      [
        t(
          "prevent, identify, investigate and deter fraudulent, harmful, unauthorized, unethical or illegal activity, including cyberattacks and identity theft.",
        ),
      ],
    ),
    labelled(
      "Data sharing in the context of corporate events.",
      t(
        "We may share certain personal information in the context of actual or prospective corporate events – for more information, see ",
      ),
      anchor(SHARE),
      t(", below."),
    ),
    labelled(
      "To create aggregated, de-identified and/or anonymized data.",
      t(
        "We may create aggregated, de-identified and/or anonymized data from your personal information and other individuals whose personal information we collect. We make personal information into de-identified and/or anonymized data by removing information that makes the data identifiable to you, and we will not attempt to reidentify any such data. We may use this aggregated, de-identified and/or anonymized data and share it with third parties for our lawful business purposes, including analyzing and improving the Service and promoting our business.",
      ),
    ),
    labelled(
      "Further uses.",
      t(
        "In some cases, we may use your personal information for further uses, in which case we will ask for your consent to use your personal information for those further purposes if they are not compatible with the initial purpose for which information was collected.",
      ),
    ),
  ),
  section(
    RETENTION,
    p(
      t(
        "We generally retain personal information to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements, establishing or defending legal claims, or for fraud prevention purposes. To determine the appropriate retention period for personal information, we may consider factors such as the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.",
      ),
    ),
    p(
      t(
        "When we no longer require the personal information we have collected about you, we may either delete it, anonymize it, or isolate it from further processing.",
      ),
    ),
    p(t("Specifically:")),
    list(
      `Letters leave the public feed ${POST_EXPIRY_DAYS} days after they are published, but they are not deleted then. We keep each letter and its comments, and anyone with the letter's link can still read them, until they are deleted as described below.`,
      "Your account, and the likes, reports, blocks and notifications that belong to it, are kept until you delete your account.",
      "Deleting a letter also deletes its comments, and deleting a letter or comment deletes the likes, reports and notifications attached to it.",
      "Deleting your account in Settings permanently deletes your account, every letter and comment you wrote (including the comments others wrote on your letters), and your likes, reports, blocks, notifications and push tokens.",
      "If you registered before March 10, 2026, your account was created through an earlier sign-in system whose records, kept in the same Supabase-hosted database, still hold the email address and salted password hash you registered with. Deleting your account does not remove that record; email us and we will delete it.",
      "We never store your password, only a salted hash of it, and we store only a hash of each password-reset link we email you, which we keep with the address it was sent to until you delete your account.",
      `We delete a device's push token when you sign out on that device or delete your account. If a device has not opened the app in ${PUSH_TOKEN_MAX_IDLE_DAYS} days, we stop sending notifications to it and delete its token before the next one would be sent.`,
    ),
  ),
  section(
    SHARE,
    p(
      t(
        "We may share your personal information with the following parties (or as otherwise described in this Privacy Policy, in other applicable notices, or at the time of collection). We do not sell your personal information or share it with advertisers.",
      ),
    ),
    labelled(
      "Service providers.",
      t(
        "Third parties that provide services on our behalf or help us operate the Service or our business (such as hosting, database hosting, email delivery, push-notification delivery and website analytics). They are:",
      ),
    ),
    list(
      "Vercel, which hosts our website and the servers that run the Service, keeps standard server logs and provides Vercel Web Analytics;",
      "Supabase, which hosts our database (we use Supabase only to host the database);",
      "Resend, which delivers password-reset emails; and",
      "Expo, Apple and Google, which deliver push notifications to our mobile apps, including the text of each notification.",
    ),
    labelled(
      "Third parties designated by you.",
      t(
        "We may share your personal information with third parties where you have instructed us or provided your consent to do so.",
      ),
    ),
    labelled(
      "Professional advisors.",
      t(
        "Professional advisors, such as lawyers, auditors, bankers and insurers, in the course of the professional services that they render to us.",
      ),
    ),
    labelled(
      "Authorities and others.",
      t(
        "Law enforcement and government authorities, only when the law requires it, and private parties, as we believe in good faith to be necessary or appropriate for the Compliance and protection purposes described above.",
      ),
    ),
    labelled(
      "Business transferees.",
      t(
        `We may disclose personal information in the context of actual or prospective business transactions (e.g., investments in ${siteConfig.name}, financing of ${siteConfig.name}, or the sale, transfer or merger of all or part of ${siteConfig.name} or its assets). For example, we may need to share certain personal information with prospective counterparties and their advisers. We may also disclose your personal information to an acquirer, successor, or assignee of ${siteConfig.name} as part of any merger, acquisition, sale of assets, or similar transaction, and/or in the event of an insolvency, bankruptcy, or receivership in which personal information is transferred to one or more third parties as one of our business assets.`,
      ),
    ),
    labelled(
      "Other users and the public.",
      t(
        'Your letters and comments, the name you sign them with, and your profile, which shows your display name, your avatar and statistics about your letters (such as how many you have written, on which days, and how many likes they have received), are visible to other users of the Service and the public, including after your letters leave the feed. Every letter links to its author\'s profile, even when it is signed "Anonymous", so letters published from the same account can be connected to each other. Only write what you are comfortable sharing with strangers. Your email address, and who liked, reported or blocked what, are not shown to others. This information can be seen, collected and used by others, including being cached, copied, screen captured or stored elsewhere by others (e.g., search engines), and we are not responsible for any such use of this information.',
      ),
    ),
  ),
  section(
    CHOICES,
    p(
      t(
        "In this section, we describe the rights and choices available to all users. Users who are located in certain U.S. states and Europe can find additional information about their rights below.",
      ),
    ),
    labelled(
      "Access or update your information.",
      t(
        "You can review and update your display name on your profile page, and add or change your email address in Settings, whether or not you have registered. An anonymous account can be managed only from a device that holds its session.",
      ),
    ),
    labelled(
      "Push notifications.",
      t(
        "If you allow notifications in our mobile apps, you can turn them off at any time in your device's settings.",
      ),
    ),
    labelled(
      "Cookies and other technologies.",
      t(
        "Most browsers let you remove or reject cookies, and clear local storage, in their settings. If you block or delete the session cookie, you will be signed out, and an anonymous account that has no email address cannot be recovered. If you clear local storage, your theme resets and any draft you have not published is lost. Blocking Vercel Web Analytics, for example with a content blocker, does not change how the Service works.",
      ),
    ),
    labelled(
      "Do Not Track.",
      t(
        'Some Internet browsers may be configured to send "Do Not Track" signals to the online services that you visit. We currently do not respond to "Do Not Track" signals because the Service does not track you across other websites.',
      ),
    ),
    labelled(
      "Declining to provide information.",
      t(
        "We need to collect personal information to provide certain services. If you do not provide the information we identify as required or mandatory, we may not be able to provide those services.",
      ),
    ),
    labelled(
      "Delete your content or close your account.",
      t(
        "You can delete any letter or comment you wrote at any time from its menu. You can close your account at any time by deleting it in Settings; the ",
      ),
      anchor(RETENTION),
      t(
        " section above describes what that deletes. To ask for a copy of your data, or for help deleting anything you cannot delete yourself, email us at ",
      ),
      email,
      t("."),
    ),
  ),
  section(
    "Other sites and services",
    p(
      t(
        "The Service may contain links to websites, mobile applications, and other online services operated by third parties. In addition, our content may be integrated into web pages or other online services that are not associated with us. These links and integrations are not an endorsement of, or representation that we are affiliated with, any third party. We do not control websites, mobile applications or online services operated by third parties, and we are not responsible for their actions. We encourage you to read the privacy policies of the other websites, mobile applications and online services you use.",
      ),
    ),
  ),
  section(
    "Security",
    p(
      t(
        "We employ technical, organizational and physical safeguards designed to protect the personal information we collect. For example, we store passwords only as salted hashes, and session cookies are signed and sent only over encrypted connections. However, security risk is inherent in all internet and information technologies and we cannot guarantee the security of your personal information.",
      ),
    ),
  ),
  section(
    "International data transfer",
    p(
      t(
        "We are based in the United States and may use service providers that operate in other countries. Your personal information may be transferred to the United States or other locations where privacy laws may not be as protective as those in your state, province, or country.",
      ),
    ),
    p(
      t("Users in Europe should read the important information provided "),
      anchor(EUROPE_NOTICE, "below"),
      t(" about transfer of personal information outside of Europe."),
    ),
  ),
  section(
    "Children",
    p(
      t(
        "The Service is not intended for use by anyone under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian of a child from whom you believe we have collected personal information in a manner prohibited by law, please contact us. If we learn that we have collected personal information through the Service from a child without the consent of the child's parent or guardian as required by law, we will comply with applicable legal requirements to delete the information.",
      ),
    ),
  ),
  section(
    "Changes to this Privacy Policy",
    p(
      t(
        "We reserve the right to modify this Privacy Policy at any time. If we make material changes to this Privacy Policy, we will notify you by updating the date of this Privacy Policy and posting it on the Service or other appropriate means. Any modifications to this Privacy Policy will be effective upon our posting the modified version (or as otherwise indicated at the time of posting). In all cases, your use of the Service after the effective date of any modified Privacy Policy indicates your acknowledging that the modified Privacy Policy applies to your interactions with the Service and our business.",
      ),
    ),
  ),
  section(
    CONTACT_US,
    p(
      t(
        "If you have questions about our practices or if you would like to exercise any privacy related right that may be available to you, please contact us via one of the methods listed below.",
      ),
    ),
    richList([b("Email"), t(": "), email]),
  ),
  section(
    STATE_NOTICE,
    p(
      t(
        'Except as otherwise provided, this section applies to residents of U.S. states to the extent they have privacy laws applicable to us that grant their residents the rights described below (collectively the "',
      ),
      b("State Privacy Laws"),
      t('").'),
    ),
    p(
      t(
        "This section describes how we collect, use, and share Personal Information of residents of these states and the rights these users may have with respect to their Personal Information. Please note that not all rights listed below may be afforded to all users and that if you are not a resident of one of these states listed above, you may not be able to exercise these rights. In addition, ",
      ),
      b(
        "we may not be able to process your request if you do not provide us with sufficient detail to allow us to confirm your identity or understand and respond to it. To confirm your identity, we will ask you to send your request from, or confirm it from, the email address associated with your account. If your account has no email address, you can add one in Settings and then send your request from it.",
      ),
    ),
    p(
      t('For purposes of this section, the term "'),
      b("Personal Information"),
      t(
        '" has the meaning given to "personal data", "personal information" or other similar terms and "',
      ),
      b("Sensitive Personal Information"),
      t(
        '" has the meaning given to "sensitive personal information," "sensitive data", or other similar terms in the State Privacy Laws, except that in neither case does such term include information exempted from the scope of the State Privacy Laws.',
      ),
    ),
    labelled(
      "Your privacy rights.",
      t(
        "The State Privacy Laws may provide residents with some or all of the rights listed below. However, these rights are not absolute and some State Privacy Laws do not provide these rights to their residents. Therefore, we may decline your request in certain cases as permitted by law.",
      ),
    ),
    labelled(
      "Information.",
      t(
        "You can request the following information about how we have collected and used your Personal Information:",
      ),
    ),
    list(
      "The categories of Personal Information that we have collected.",
      "The categories of sources from which we collected Personal Information.",
      "The business or commercial purpose for collecting and/or selling Personal Information.",
      "The categories of third parties with which we share Personal Information.",
      "The categories of Personal Information that we sold or disclosed for a business purpose.",
      "The categories of third parties to whom the Personal Information was sold or disclosed for a business purpose.",
    ),
    labelled(
      "Access.",
      t("You can request a copy of the Personal Information that we have collected about you."),
    ),
    labelled("Appeal.", t("You can appeal our denial of any request validly submitted.")),
    labelled(
      "Correction.",
      t(
        "You can ask us to correct inaccurate Personal Information that we have collected about you.",
      ),
    ),
    labelled(
      "Deletion.",
      t("You can ask us to delete the Personal Information that we have collected from you."),
    ),
    p(b("Opt-out.")),
    richList(
      [
        b("Opt-out of certain processing for targeted advertising purposes."),
        t(" We do not process your personal information for targeted advertising purposes."),
      ],
      [
        b("Opt-out of or appeal profiling/automated decision making."),
        t(
          " We do not use your Personal Information to engage in profiling or to perform automated decision-making that results in significant financial impacts, significant impacts on housing, education, employment, health care, or criminal justice, or similarly significant impacts.",
        ),
      ],
      [
        b("Opt-out of other sales of personal data."),
        t(" We do not sell your Personal Information within the meaning of State Privacy Laws."),
      ],
    ),
    labelled(
      "Consumers under 16.",
      t("We do not sell or share the personal information of consumers under 16 years of age."),
    ),
    labelled(
      "Sensitive Personal Information.",
      t(
        "While we process certain categories of Sensitive Personal Information as described in this Privacy Policy, such as the login credentials for your account, we do not process Sensitive Personal Information for the purpose of inferring characteristics about consumers under the CCPA.",
      ),
    ),
    labelled(
      "Nondiscrimination.",
      t(
        "You are entitled to exercise the rights described above free from discrimination as prohibited by the State Privacy Laws.",
      ),
    ),
    labelled(
      'Exercising your right to opt-out of the "sale" or "sharing" of your Personal Information.',
      t(
        'We do not sell your Personal Information or "share" it for cross-context behavioral advertising, as the State Privacy Laws define those terms, so there is nothing to opt out of. If that ever changes, we will update this Privacy Policy first, offer a way to opt out, and honor Global Privacy Control ("GPC") signals as valid opt-out requests, as required by applicable law.',
      ),
    ),
    labelled(
      "Exercising other state privacy rights.",
      t(
        "You may submit requests to exercise any of the other state privacy rights listed above via email to ",
      ),
      email,
      t("."),
    ),
    labelled(
      "Verification of Identity; Authorized agents.",
      t(
        "We may need to verify your identity in order to process your information, access, appeal, correction, or deletion requests and reserve the right to confirm your residency. To verify your identity, we may require government identification, a declaration under penalty of perjury, or other information, where permitted by law.",
      ),
    ),
    p(
      t(
        "Under some State Privacy Laws, you may enable an authorized agent to make a request on your behalf. However, we may need to verify your authorized agent's identity and authority to act on your behalf. We may require a copy of a valid power of attorney given to your authorized agent pursuant to applicable law. If you have not provided your agent with such a power of attorney, we may ask you to take additional steps permitted by law to verify that your request is authorized, such as by providing your agent with written and signed permission to exercise your State Privacy Laws rights on your behalf, the information we request to verify your identity, and confirmation that you have given the authorized agent permission to submit the request.",
      ),
    ),
    labelled(
      "Information practices.",
      t("The following describes our practices currently and during the past 12 months:"),
    ),
    richList(
      [
        b("Sources and purposes."),
        t(
          " We collect all categories of personal information from the sources and use them for the business/commercial purposes described above in the Privacy Policy.",
        ),
      ],
      [
        b("Retention."),
        t(
          " The criteria for deciding how long to retain personal information is generally based on whether such period is sufficient to fulfill the purposes for which we collected it as described in this notice, including complying with our legal obligations.",
        ),
      ],
      [
        b("Deidentification."),
        t(
          " We do not attempt to reidentify deidentified information derived from personal information, except for the purpose of testing whether our deidentification processes comply with applicable law.",
        ),
      ],
    ),
    labelled(
      "Personal information that we collect, use and disclose.",
      t(
        'We have summarized the Personal Information we collect, the purposes for which we collect it and the third parties to whom we may disclose it by reference below to both the categories defined in the "Personal information we collect" section of this Privacy Policy above and the categories of Personal Information specified in the CCPA (Cal. Civ. Code §1798.140). This chart describes our practices currently and during the 12 months preceding the effective date of this Privacy Policy. Information you voluntarily provide to us, such as in the letters, comments and emails you write, may contain other categories of personal information not described below.',
      ),
    ),
    table(
      [
        'Personal Information ("PI") we collect',
        "CCPA statutory category",
        "Purposes",
        'Categories of third parties to whom we "disclose" PI for a business purpose',
        'Categories of third parties to whom we "sell" or "share" PI',
      ],
      [
        "Contact data",
        "Identifiers; California Customer Records",
        "Service delivery and operations; Compliance and protection; Data sharing in the context of corporate events",
        "Service providers; Professional advisors; Authorities and others; Business transferees",
        "None",
      ],
      [
        "Profile data",
        "Identifiers; Sensitive personal information (account log-in credentials)",
        "Service delivery and operations; Compliance and protection; Data sharing in the context of corporate events",
        "Service providers; Other users and the public (your display name and avatar); Professional advisors; Authorities and others; Business transferees",
        "None",
      ],
      [
        "Communications data",
        "Identifiers; California Customer Records",
        "Service delivery and operations; Compliance and protection",
        "Service providers; Professional advisors; Authorities and others; Business transferees",
        "None",
      ],
      [
        "User-generated content and input data",
        "Identifiers; Internet or other electronic network activity information; Audio, electronic, visual or similar information",
        "Service delivery and operations; Compliance and protection; To create aggregated, de-identified and/or anonymized data",
        "Service providers; Other users and the public (your letters, comments and the names you sign them with); Professional advisors; Authorities and others; Business transferees",
        "None",
      ],
      [
        "Device data",
        "Identifiers; Internet or other electronic network activity information",
        "Service delivery and operations; Service personalization; Service improvement and analytics; Compliance and protection",
        "Service providers; Professional advisors; Authorities and others; Business transferees",
        "None",
      ],
      [
        "Online activity data",
        "Internet or other electronic network activity information",
        "Service improvement and analytics; Compliance and protection",
        "Service providers; Professional advisors; Authorities and others; Business transferees",
        "None",
      ],
    ),
    p(b("Additional information for California residents.")),
    labelled(
      "Shine the light law.",
      t(
        "Under California's Shine the Light law (California Civil Code Section 1798.83), California residents may ask companies with whom they have formed a business relationship primarily for personal, family or household purposes to provide the names of third parties to which they have disclosed certain personal information (as defined under the Shine the Light law) during the preceding calendar year for their own direct marketing purposes, and the categories of personal information disclosed. We do not disclose personal information to third parties for their own direct marketing purposes. You may send us requests for this information to ",
      ),
      email,
      t(
        '. In your request, you must include the statement "Shine the Light Request," and provide your first and last name and mailing address and certify that you are a California resident. We reserve the right to require additional information to confirm your identity and California residency. Please note that we will not accept requests via telephone, mail, or facsimile, and we are not responsible for notices that are not labeled or sent properly, or that do not have complete information.',
      ),
    ),
    labelled(
      "Additional information for Nevada residents.",
      t(
        "Nevada residents have the right to opt-out of the sale of certain personal information for monetary consideration. While we do not currently engage in such sales, if you are a Nevada resident and would like to make a request to opt out of any potential future sales, please email ",
      ),
      email,
      t("."),
    ),
    labelled(
      "Contact Us.",
      t(
        "If you have questions or concerns about our privacy policies or information practices, please contact us using the contact details set forth in the ",
      ),
      anchor(CONTACT_US),
      t(" section above."),
    ),
  ),
  section(
    EUROPE_NOTICE,
    p(b("General")),
    labelled(
      "Where this Notice to European users applies.",
      t(
        'The information provided in this "Notice to European users" section applies only to individuals in the United Kingdom and the European Economic Area (i.e., "Europe" as defined at the top of this Privacy Policy).',
      ),
    ),
    labelled(
      "Personal information.",
      t(
        'References to "personal information" in this Privacy Policy should be understood to include a reference to "personal data" (as defined in the GDPR) – i.e., information about individuals from which they are either directly identified or can be identified.',
      ),
    ),
    labelled(
      "Controller.",
      t(
        `${siteConfig.author.name}, who provides ${siteConfig.name}, is the controller in respect of the processing of your personal information covered by this Privacy Policy for purposes of European data protection legislation (i.e., the EU GDPR and the so-called 'UK GDPR' (as and where applicable, the "GDPR")). See the 'How to contact us' section above for our contact details.`,
      ),
    ),
    p(b("Our legal bases for processing")),
    p(
      t(
        'In respect of each of the purposes for which we use your personal information, the GDPR requires us to ensure that we have a "legal basis" for that use.',
      ),
    ),
    p(
      t(
        "Our legal bases for processing your personal information described in this Privacy Policy are listed below.",
      ),
    ),
    richList(
      [
        t(
          'Where we need to perform a contract, we are about to enter into or have entered into with you ("',
        ),
        b("Contractual Necessity"),
        t('").'),
      ],
      [
        t(
          'Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests ("',
        ),
        b("Legitimate Interests"),
        t(
          '"). More detail about the specific legitimate interests pursued in respect of each Purpose we use your personal information for is set out in the table below.',
        ),
      ],
      [
        t('Where we need to comply with a legal or regulatory obligation ("'),
        b("Compliance with Law"),
        t('").'),
      ],
      [
        t(
          'Where we have your specific consent to carry out the processing for the Purpose in question ("',
        ),
        b("Consent"),
        t('").'),
      ],
    ),
    p(
      t(
        "We have set out below, in a table format, the legal bases we rely on in respect of the relevant Purposes for which we use your personal information – for more information on these Purposes and the data types involved, see 'How we use your personal information'.",
      ),
    ),
    table(
      ["Purpose", "Categories of personal information involved", "Legal basis"],
      [
        "Service delivery and operations",
        "Contact data; Profile data; Communications data; User-generated content and input data; Device data",
        "Contractual Necessity.",
      ],
      [
        "Service personalization",
        "Device data",
        "Legitimate Interests. We have a legitimate interest in providing you with a good service, which is personalised to you and that remembers your selections and preferences.",
      ],
      [
        "Service improvement and analytics",
        "Device data; Online activity data",
        "Legitimate Interests. We have a legitimate interest in providing you with a good service, and in understanding how the Service is used so that we can improve it.",
      ],
      [
        "Compliance and protection",
        "Contact data; Profile data; Communications data; User-generated content and input data; Device data; Online activity data",
        "Compliance with Law. Legitimate Interests. Where Compliance with Law is not applicable, we and any relevant third parties have a legitimate interest in participating in, supporting, and following legal process and requests. We and any relevant third parties may also have a legitimate interest of ensuring the protection, maintenance, and enforcement of our and their rights, property, and/or safety.",
      ],
      [
        "Data sharing in the context of corporate events",
        "Any and all data types relevant in the circumstances",
        "Legitimate Interests. We and any relevant third parties have a legitimate interest in providing information to relevant third parties who are involved in an actual or prospective corporate event (including to enable them to investigate – and, where relevant, to continue to operate – all or relevant part(s) of our operations). However, we would always look to take steps to minimize the amount and sensitivity of any personal information shared in these contexts where possible and appropriate.",
      ],
      [
        "To create aggregated, de-identified and/or anonymized data",
        "Any and all data types relevant in the circumstances",
        "Legitimate Interests. We have legitimate interest, and believe it is also in your interests, that we are able to take steps to ensure that the Service operates as intended.",
      ],
      [
        "Further uses",
        "Any and all data types relevant in the circumstances",
        "The original legal basis relied upon, if the relevant further use is compatible with the initial purpose for which the Personal Information was collected. Consent, if the relevant further use is not compatible with the initial purpose for which the personal information was collected.",
      ],
    ),
    p(b("Retention")),
    p(
      t(
        "We retain personal information for as long as necessary to fulfil the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements, establishing or defending legal claims, or for Compliance and protection purposes.",
      ),
    ),
    p(
      t(
        "To determine the appropriate retention period for personal information, we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.",
      ),
    ),
    p(
      t(
        "When we no longer require the personal information we have collected about you, we will either delete or anonymize it or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible. If we anonymize your personal information (so that it can no longer be associated with you), we may use this information indefinitely without further notice to you.",
      ),
    ),
    p(b("Other info")),
    labelled(
      "No sensitive personal information.",
      t(
        "The Service does not ask you for any sensitive personal information (e.g., social security numbers, information related to racial or ethnic origin, political opinions, religion or other beliefs, health, biometrics or genetic characteristics, criminal background or trade union membership). If you choose to include sensitive personal information in a letter or comment you write, you consent to our processing it in accordance with this Privacy Policy solely to provide the Service to you, including publishing it as part of your letter or comment. If you do not consent, do not include it.",
      ),
    ),
    labelled(
      "No Automated Decision-Making and Profiling.",
      t(
        "As part of the Service, we do not engage in automated decision-making and/or profiling, which produces legal or similarly significant effects.",
      ),
    ),
    p(b("Your rights")),
    labelled(
      "General.",
      t(
        "European data protection laws give you certain rights regarding your personal information. If you are located in Europe, you may ask us to take the following actions in relation to your personal information that we hold:",
      ),
    ),
    richList(
      [
        b("Access."),
        t(
          " Provide you with information about our processing of your personal information and give you access to your personal information.",
        ),
      ],
      [b("Correct."), t(" Update or correct inaccuracies in your personal information.")],
      [
        b("Delete."),
        t(
          " Delete your personal information where there is no good reason for us continuing to process it – you also have the right to ask us to delete or remove your personal information where you have exercised your right to object to processing (see below).",
        ),
      ],
      [
        b("Transfer."),
        t(
          " Transfer a machine-readable copy of your personal information to you or a third party of your choice.",
        ),
      ],
      [
        b("Restrict."),
        t(
          " Restrict the processing of your personal information, for example if you want us to establish its accuracy or the reason for processing it.",
        ),
      ],
      [
        b("Object."),
        t(
          " Object to our processing of your personal information where we are relying on Legitimate Interests – you also have the right to object where we are processing your personal information for direct marketing purposes.",
        ),
      ],
      [
        b("Withdraw Consent."),
        t(
          " When we use your personal information based on your consent, you have the right to withdraw that consent at any time.",
        ),
      ],
    ),
    labelled(
      "Exercising These Rights.",
      t("You may submit these requests by email to "),
      email,
      t(
        ". We may request specific information from you to help us confirm your identity and process your request. Whether or not we are required to fulfill any request you make will depend on a number of factors (e.g., why and how we are processing your personal information), if we reject any request you may make (whether in whole or in part) we will let you know our grounds for doing so at the time, subject to any legal restrictions.",
      ),
    ),
    labelled(
      "Your Right to Lodge a Complaint with your Supervisory Authority.",
      t(
        "In addition to your rights outlined above, if you are not satisfied with our response to a request you make, or how we process your personal information, you can make a complaint to the data protection regulator in your habitual place of residence.",
      ),
    ),
    p(
      t(
        "For users in the European Economic Area – the contact information for the data protection regulator in your place of residence can be found here: ",
      ),
      link(
        "https://www.edpb.europa.eu/about-edpb/our-members_en",
        "https://www.edpb.europa.eu/about-edpb/our-members_en",
      ),
    ),
    p(
      t(
        "For users in the UK – the contact information for the UK data protection regulator is below:",
      ),
    ),
    p(
      t(
        "The Information Commissioner's Office, Water Lane, Wycliffe House, Wilmslow – Cheshire SK9 5AF, Tel. +44 303 123 1113, Website: ",
      ),
      link("https://ico.org.uk/make-a-complaint/", "https://ico.org.uk/make-a-complaint/"),
    ),
    p(b("Data Processing outside Europe")),
    p(
      t(
        "We are based in the U.S. and many of our service providers, advisers or other recipients of data are also based in the U.S. This means that, if you use the Service, your personal information will necessarily be accessed and processed in the U.S. It may also be provided to recipients in other countries outside Europe.",
      ),
    ),
    p(
      t(
        "It is important to note that the U.S. is not the subject of a general 'adequacy decision' under the GDPR – the EU-U.S. Data Privacy Framework and its UK Extension cover only organizations certified under them, and we are not certified. Basically, this means that the U.S. legal regime is not considered by relevant European bodies to provide an adequate level of protection for personal information transferred to us, which is equivalent to that provided by relevant European laws.",
      ),
    ),
    p(
      t(
        "Where we share your personal information with third parties who are based outside Europe, we try to ensure a similar degree of protection is afforded to it by making sure one of the following mechanisms is implemented:",
      ),
    ),
    richList(
      [
        b("Transfers to territories with an adequacy decision."),
        t(
          " We may transfer your personal information to countries or territories whose laws have been deemed to provide an adequate level of protection for personal information by the European Commission or UK Government (as and where applicable) (from time to time).",
        ),
      ],
      [
        b("Transfers to territories without an adequacy decision."),
        t(
          " We may transfer your personal information to countries or territories whose laws have not been deemed to provide such an adequate level of protection (e.g., the U.S., see above). However, in these cases: we may use specific appropriate safeguards, which are designed to give personal information effectively the same protection it has in Europe – for example, standard-form contracts approved by relevant authorities for this purpose; or in limited circumstances, we may rely on an exception, or 'derogation', which permits us to transfer your personal information to such country despite the absence of an 'adequacy decision' or 'appropriate safeguards' – for example, reliance on your explicit consent to that transfer.",
        ),
      ],
    ),
    p(
      t(
        "You may contact us if you want further information on the specific mechanism used by us when transferring your personal information out of Europe. You may have the right to receive a copy of the appropriate safeguards under which your personal information is transferred by contacting us at ",
      ),
      email,
      t("."),
    ),
  ),
];

export const privacyPage: ProsePage = {
  description: `What ${siteConfig.name} collects, why, who processes it, how to delete it, and your privacy rights.`,
  footnote: [generalLegalCredit],
  intro: [
    p(t(`Effective as of ${LEGAL_EFFECTIVE_DATE}.`)),
    p(
      t("To view previous versions of this Privacy Policy, see "),
      link(
        `${siteConfig.repository}/commits/main/apps/web/src/lib/agent/site-pages.ts`,
        "its history on GitHub",
      ),
      t("."),
    ),
    p(
      b("California Notice at Collection/State Privacy Rights Notice"),
      t(": See the "),
      anchor(STATE_NOTICE),
      t(
        " section below for important information about your rights under applicable state privacy laws.",
      ),
    ),
    p(
      t(`${siteConfig.author.name} ("`),
      b(siteConfig.name),
      t('," "'),
      b("we"),
      t('," "'),
      b("us"),
      t('" or "'),
      b("our"),
      t(
        `") provides ${siteConfig.name}, a free, open-source space where anyone can publish short letters, anonymously or under a name they choose, that leave the public feed after ${POST_EXPIRY_DAYS} days. This Privacy Policy describes how ${siteConfig.name} processes personal information that we collect through our digital or online properties or services that link to this Privacy Policy (including, as applicable, our website at ${WEB_HOST}, our iOS and Android apps, and the earlier version of those apps, which shows the website inside the app) and the other activities described in this Privacy Policy (collectively, the "`,
      ),
      b("Service"),
      t(
        '"). The Service is open source: the code that collects and processes the information described here is public at ',
      ),
      repo,
      t("."),
    ),
    p(
      b("Notice to European users"),
      t(": Please see the "),
      anchor(EUROPE_NOTICE),
      t(
        ' section below for additional information for individuals located in the European Economic Area or United Kingdom (which we refer to as "Europe", and "European" should be understood accordingly).',
      ),
    ),
    p(b("Index")),
    richList(...privacySections.map((entry) => [anchor(entry.heading)])),
  ],
  path: "/privacy",
  sections: privacySections,
  title: "Privacy Policy",
};

/** A numbered subsection of the Terms, "N.M **Title.** text". Numbers are fixed
    because the Terms cross-reference them (Sections 2.7, 8, 11). */
const clause = (number: string, title: string, ...content: Inline[]): Block =>
  p(t(`${number} `), b(title), t(" "), ...content);

const termsSections: Section[] = [
  section(
    "1. Accounts",
    clause(
      "1.1",
      "Creating an Account.",
      t(
        "You can use the Site without registering. The first time you publish, like or report a letter or comment, or block a writer, the Site creates an anonymous account for you, with no email address or password, and remembers it on your device. You may also register for an account with an email address and password, which lets you sign in on other devices and reset your password. When you register, you agree to provide accurate and complete information and to keep that information current. Please only enter information in your letters, comments and display name that you are willing to share with other users of the Site, who can see them. You can delete your account at any time in Settings. We may suspend or terminate your account as described in Section 8.",
      ),
    ),
    clause(
      "1.2",
      "Account Security.",
      t(
        "You are responsible for keeping your login credentials confidential and for all activity that occurs under your account. An anonymous account can be reached only through the session your device holds, so if that session is lost, for example because you clear your browser's cookies, the account cannot be recovered unless you have added an email address to it. If you believe your account has been accessed without your authorization, please notify us immediately; resetting your password also signs your account out on every other device. We are not liable for any losses resulting from your failure to keep your credentials secure.",
      ),
    ),
  ),
  section(
    "2. Access to the Site",
    clause(
      "2.1",
      "License.",
      t(
        "Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Site for your own personal, non-commercial purposes.",
      ),
    ),
    clause(
      "2.2",
      "Restrictions.",
      t(
        "You may not: (i) license, sell, rent, lease, transfer, assign, distribute, or commercially exploit the Site or any content on it; (ii) modify, create derivative works from, disassemble, reverse-compile, or reverse-engineer any part of the Site; (iii) access the Site in order to build a similar or competing product or service; or (iv) copy, reproduce, distribute, republish, download, display, post, or transmit any part of the Site except as expressly permitted by these Terms. All copyright and proprietary notices on the Site must be kept intact on any copies you are permitted to make.",
      ),
    ),
    clause(
      "2.3",
      "Changes to the Site.",
      t(
        "We may modify, suspend, or discontinue the Site (or any part of it) at any time, with or without notice. We are not liable to you or any third party for any such modification, suspension, or discontinuation.",
      ),
    ),
    clause(
      "2.4",
      "No Support Obligation.",
      t("We have no obligation to provide you with support or maintenance for the Site."),
    ),
    clause(
      "2.5",
      "Ownership.",
      t(
        `All intellectual property rights in the Site and its content – including copyrights, patents, trademarks, and trade secrets – belong to ${siteConfig.name} or its suppliers, except Your Content and other users' content (see Section 2.7). These Terms do not transfer any ownership rights to you, except for the limited access rights in Section 2.1. All rights not expressly granted are reserved.`,
      ),
    ),
    clause(
      "2.6",
      "Feedback.",
      t(
        "If you share feedback or suggestions about the Site with us, you grant us a perpetual, irrevocable, worldwide, non-exclusive, fully-paid, royalty-free license to use that feedback freely, in any manner and for any purpose, without attribution. Please do not submit any feedback that you consider proprietary or confidential.",
      ),
    ),
    clause(
      "2.7",
      "Your Content.",
      t('"'),
      b("Your Content"),
      t(
        `" means the letters, comments and other content you submit to the Site, including the name you sign them with. You retain ownership of Your Content. You grant us a worldwide, non-exclusive, royalty-free license to host, store, reproduce, modify (for example, to format it for display), publish and display Your Content, solely to operate and provide the Site, including by showing your letters in the public feed for ${POST_EXPIRY_DAYS} days after you publish them, and your letters and their comments at their own links until they are deleted. This license ends when Your Content is deleted from the Site. You are responsible for Your Content, and you represent that you have all rights needed to grant this license. Your Content must not: (i) violate laws or regulations; (ii) infringe others' rights; (iii) contain malware or viruses; (iv) include hate speech or discrimination; or (v) promote illegal activities. We may remove any content, including Your Content, at our discretion, and content that several accounts mark as inappropriate is hidden automatically.`,
      ),
    ),
    clause(
      "2.8",
      "Acceptable Use.",
      t(
        "You may not: (i) post illegal, harmful, or offensive content; (ii) impersonate others; (iii) spam or harass other users; (iv) attempt to hack or disrupt the Site; (v) use the Site for commercial purposes without our authorization; (vi) share explicit or inappropriate content; or (vii) violate others' intellectual property rights. We respect the intellectual property rights of others and expect you to do the same.",
      ),
    ),
    clause(
      "2.9",
      "Open-Source Software.",
      t(
        "Source code that we publish under an open-source license, such as the MIT License, is governed by that license, and nothing in these Terms limits your rights under it. These Terms govern the hosted Site. The Site's source code is published under the MIT License at ",
      ),
      repo,
      t("."),
    ),
  ),
  section(
    "3. Privacy",
    p(
      t("Your use of the Site is also governed by our Privacy Policy, which is available at "),
      privacyPolicyLink,
      t(
        " and is incorporated into these Terms by reference. The Privacy Policy describes the types of personal data and other information we collect from you or your device, how we use that information, and the circumstances under which we may share it with third parties.",
      ),
    ),
    clause(
      "3.1",
      "Processing of Personal Data.",
      t(
        `By using the Site, you acknowledge that you have read and understand our Privacy Policy and that ${siteConfig.name} will process your personal data and other information in accordance with the Privacy Policy. If there is a conflict between these Terms and the Privacy Policy with respect to the collection, use, or processing of your personal data, the Privacy Policy will control.`,
      ),
    ),
    clause(
      "3.2",
      "Cookies and Tracking Technologies.",
      t('The Site may use cookies, web beacons, pixels, and similar tracking technologies ("'),
      b("Tracking Technologies"),
      t(
        '") to collect information about your use of the Site. For details on what Tracking Technologies the Site uses, what information they collect, and how you can manage your preferences, please refer to the ',
      ),
      link(`/privacy#${headingId(TRACKING)}`, `${TRACKING} section of our Privacy Policy`),
      t("."),
    ),
  ),
  section(
    "4. Indemnification",
    p(
      t(
        `You agree to defend, indemnify, and hold harmless ${siteConfig.name} and its officers, employees, and agents from any claims and reasonable costs or attorneys' fees arising out of (i) your use of the Site, (ii) your violation of these Terms, or (iii) your violation of any applicable law or regulation. We may assume control of the defense of any such claim at your expense, and you agree to cooperate with our defense. You agree not to settle any such claim without our prior written consent. We will make reasonable efforts to notify you promptly of any claim we become aware of.`,
      ),
    ),
  ),
  section(
    "5. Third-Party Services & Other Users",
    clause(
      "5.1",
      "Third-Party Services.",
      t(
        'The Site may include links to or integrations with third-party websites or services (collectively, "',
      ),
      b("Third-Party Services"),
      t(
        "\"). We do not control, endorse, or take responsibility for any Third-Party Services. You use all Third-Party Services at your own risk, and you acknowledge and agree that the applicable third party's own terms and privacy practices will apply to such use.",
      ),
    ),
    clause(
      "5.2",
      "Other Users.",
      t(
        "Your interactions with other users of the Site are solely between you and those users. We are not responsible for any loss or harm resulting from those interactions, and we reserve the right, but have no obligation, to get involved in disputes between users.",
      ),
    ),
    clause(
      "5.3",
      "Release.",
      t(
        `To the fullest extent permitted by law, you release ${siteConfig.name} and its officers, employees, agents, successors, and assigns from all claims, demands, and damages of any kind arising out of or related to the Site, other users, or Third-Party Services. If you are a California resident, you waive California Civil Code Section 1542, which provides: "A general release does not extend to claims which the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release, which if known by him or her must have materially affected his or her settlement with the debtor or released party."`,
      ),
    ),
  ),
  section(
    "6. Disclaimers",
    p(
      t(
        `THE SITE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT PERMITTED BY LAW, ${NAME_CAPS} AND ITS SUPPLIERS DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL CODE. WHERE APPLICABLE LAW REQUIRES WARRANTIES, THEY ARE LIMITED TO 90 DAYS FROM YOUR FIRST USE.`,
      ),
    ),
  ),
  section(
    "7. Limitation of Liability",
    p(
      t(
        `TO THE MAXIMUM EXTENT PERMITTED BY LAW: (A) ${NAME_CAPS} AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY LOST PROFITS, LOST DATA, COSTS OF SUBSTITUTE PRODUCTS, OR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF (OR INABILITY TO USE) THE SITE; AND (B) OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING UNDER THESE TERMS IS CAPPED AT THE GREATER OF (i) $50 USD AND (ii) THE AMOUNT PAID TO ${NAME_CAPS} BY YOU UNDER THESE TERMS IN THE SIX MONTHS PRIOR TO THE INCIDENT GIVING RISE TO THE CLAIM. THE EXISTENCE OF MULTIPLE CLAIMS DOES NOT INCREASE THIS CAP.`,
      ),
    ),
  ),
  section(
    "8. Term and Termination",
    p(
      t(
        "These Terms remain in effect while you use the Site. We may suspend or terminate your access (including suspending access to or deleting your account) at any time and for any reason, including if we believe you have violated these Terms. We are not liable to you for any such termination. You may stop using the Site, or delete your account, at any time. Upon termination, Sections 2.2 through 2.6, Section 2.7 as to any of Your Content that remains on the Site, and Sections 3 through 11 will survive.",
      ),
    ),
  ),
  section(
    "9. State-Specific Legal Notices",
    p(
      t(
        "The provisions in this Section 9 apply only to users to the extent such users are subject to the laws of the applicable states identified below. If a provision in this section conflicts with another provision of these Terms, the state-specific provision controls for users subject to that state's laws.",
      ),
    ),
    clause(
      "9.1",
      "California.",
      t(
        `If you are a California resident, you may report complaints to the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs, at 1625 N. Market Blvd. Suite N112, Sacramento, CA 95834, or by phone at (800) 952-5210. Under California Civil Code Section 1789.3, California users of the Site are entitled to the following specific consumer rights notice: The provider of the Site is ${siteConfig.author.name}. To file a complaint regarding the Site, or to receive further information regarding use of the Site, contact us at `,
      ),
      termsEmail,
      t(
        ". You may also contact the Complaint Assistance Unit at the address and phone number above. If you are a California resident, you may have additional rights under the California Consumer Privacy Act (as amended by the California Privacy Rights Act), including the right to know what personal information we collect, the right to delete your personal information, the right to correct inaccurate personal information, and the right to opt out of the sale or sharing of your personal information. For details on how to exercise these rights, please see our Privacy Policy at ",
      ),
      privacyPolicyLink,
      t("."),
    ),
    clause(
      "9.2",
      "Colorado.",
      t(
        "If you are a Colorado resident, you may have additional rights under the Colorado Privacy Act (CPA), including the right to opt out of the processing of your personal data for purposes of targeted advertising, the sale of personal data, and certain profiling. For details, please see our Privacy Policy.",
      ),
    ),
    clause(
      "9.3",
      "Connecticut.",
      t(
        "If you are a Connecticut resident, you may have additional rights under the Connecticut Data Privacy Act (CTDPA), including rights of access, correction, deletion, and data portability, as well as the right to opt out of the sale of personal data, targeted advertising, and profiling. For details, please see our Privacy Policy.",
      ),
    ),
    clause(
      "9.4",
      "Virginia.",
      t(
        "If you are a Virginia resident, you may have additional rights under the Virginia Consumer Data Protection Act (VCDPA), including the right to access, correct, delete, and obtain a copy of your personal data, and the right to opt out of the processing of your personal data for targeted advertising, sale, or profiling. For details, please see our Privacy Policy.",
      ),
    ),
    clause(
      "9.5",
      "Nevada.",
      t(
        "If you are a Nevada resident, you have the right under Nevada Revised Statutes Chapter 603A to direct us not to sell certain information we have collected or will collect about you. To exercise this right, please contact us at ",
      ),
      termsEmail,
      t("."),
    ),
    clause(
      "9.6",
      "Other States.",
      t(
        "If you are a resident of another U.S. state with a comprehensive consumer privacy law, such as Texas, Oregon, Montana, Utah, Iowa, Indiana or Tennessee, you may have similar rights under that law. For details, please see our Privacy Policy.",
      ),
    ),
  ),
  section(
    "10. General",
    clause(
      "10.1",
      "Changes to Terms.",
      t(
        "We may update these Terms from time to time. If we make material changes, we will notify you by email (at the address on file, if you have given us one) or by a prominent notice on the Site. Your continued use of the Site after notice of changes means you accept the updated Terms.",
      ),
    ),
    clause(
      "10.2",
      "Governing Law.",
      t(
        `These Terms and any dispute arising out of or related to these Terms or the Site will be governed by and construed in accordance with the laws of the State of California, without regard to its conflict-of-law principles. For any claim or dispute not subject to the arbitration provisions in Section 11, you and ${siteConfig.name} irrevocably consent to the exclusive jurisdiction and venue of the state and federal courts located in San Francisco County, California. Notwithstanding the foregoing: (a) either party may bring an action in any court of competent jurisdiction for injunctive or other equitable relief to protect its intellectual property rights (including patents, copyrights, trademarks, and trade secrets); and (b) either party may bring an individual action in small claims court for claims within that court's jurisdictional limits.`,
      ),
    ),
    clause(
      "10.3",
      "Export.",
      t(
        "You agree not to export, re-export, or transfer any technical data or products acquired from the Site in violation of U.S. export control laws or applicable regulations in other countries.",
      ),
    ),
    clause(
      "10.4",
      "Electronic Communications.",
      t(
        "By using the Site, you consent to receiving communications from us electronically (by email or notices posted on the Site). These electronic communications satisfy any legal requirement for written notice.",
      ),
    ),
    clause(
      "10.5",
      "Accessibility.",
      t(
        `${siteConfig.name} is committed to making the Site accessible to all users, including individuals with disabilities. We endeavor to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA, as published by the World Wide Web Consortium (W3C). If you experience any difficulty accessing or navigating the Site, or if you have suggestions for improving accessibility, please contact us at `,
      ),
      termsEmail,
      t(". We will make reasonable efforts to address accessibility concerns promptly."),
    ),
    clause(
      "10.6",
      "Entire Agreement.",
      t(
        `These Terms (together with the Privacy Policy and any other policies or guidelines referenced herein) are the entire agreement between you and ${siteConfig.name} regarding your use of the Site. If any provision of these Terms is found to be invalid or unenforceable, it will be modified to the minimum extent necessary to be valid, and the remaining provisions will continue in effect. Our failure to enforce any provision is not a waiver of that provision. The word "including" means "including without limitation." You may not assign these Terms without our prior written consent; we may assign them freely. These Terms bind any permitted assignees.`,
      ),
    ),
    clause(
      "10.7",
      "Copyright/Trademark.",
      t(
        `Copyright © 2026 ${siteConfig.author.name}. All rights reserved. All trademarks, logos, and service marks displayed on the Site are owned by ${siteConfig.name} or third parties. You may not use any of them without prior written consent from the owner. Open-source code is licensed as described in Section 2.9.`,
      ),
    ),
    clause(
      "10.8",
      "Contact Information.",
      t("For any questions about these Terms, please contact us at "),
      termsEmail,
      t("."),
    ),
  ),
  section(
    "11. Dispute Resolution",
    p(
      b(
        "Please read this section carefully. It affects your legal rights, including your right to sue in court and your right to a jury trial.",
      ),
    ),
    clause(
      "11.1",
      "Applicability.",
      t(
        `Except as described below, you and ${siteConfig.name} agree to resolve all disputes arising out of or relating to the Site, its services, or these Terms through binding individual arbitration – not in court. Exceptions include: (i) claims that qualify for small claims court, brought on an individual basis; and (ii) requests for equitable relief related to intellectual property (such as trademarks, trade secrets, or copyrights). This arbitration agreement applies to all claims, including those that arose before you agreed to these Terms.`,
      ),
    ),
    clause(
      "11.2",
      "Try to Resolve First.",
      t(
        'Before starting arbitration, the parties agree to try to resolve the dispute informally. The party raising the dispute must send written notice (an "Informal Notice") to the other party. Within 45 days of receiving that Informal Notice, the parties will meet by phone or video in good faith to try to work things out. Our notice address is ',
      ),
      termsEmail,
      t(
        ". If the informal dispute resolution process doesn't resolve the dispute within 60 days, either party may start arbitration.",
      ),
    ),
    clause(
      "11.3",
      "Arbitration Rules.",
      t("Arbitrations will be administered by JAMS ("),
      link("https://www.jamsadr.com", "www.jamsadr.com"),
      t(
        "). Claims under $250,000 (excluding fees and interest) will use JAMS' Streamlined Arbitration Rules; larger claims will use JAMS' Comprehensive Arbitration Rules. Unless the parties agree otherwise, arbitration will be conducted in the county where you live. All arbitration materials and documents are confidential.",
      ),
    ),
    clause(
      "11.4",
      "Arbitration Request.",
      t(
        "The arbitration request must include: (i) your contact information and account username (if applicable); (ii) a description of the claims and supporting facts; (iii) the relief you're seeking and a good-faith damages estimate; (iv) confirmation that you completed the informal resolution process; and (v) proof of any required filing fee payment.",
      ),
    ),
    clause(
      "11.5",
      "Authority of Arbitrator.",
      t(
        "The arbitrator has authority to resolve all arbitrable disputes, including questions about the scope and enforceability of this arbitration agreement – except that courts (not arbitrators) will decide: (i) challenges to the class action waiver below; (ii) disputes about arbitration fees; (iii) whether a condition precedent to arbitration has been satisfied; and (iv) which version of this agreement applies. The arbitrator may award the same relief as a court, but on an individual basis only. The arbitrator's award is final and binding, and judgment may be entered in any court with jurisdiction.",
      ),
    ),
    clause(
      "11.6",
      "Waiver of Jury Trial.",
      t(
        `BY AGREEING TO ARBITRATION, YOU AND ${NAME_CAPS} WAIVE THE RIGHT TO A TRIAL BY JUDGE OR JURY FOR ALL COVERED CLAIMS.`,
      ),
    ),
    clause(
      "11.7",
      "Waiver of Class Actions.",
      t(
        `ALL DISPUTES MUST BE BROUGHT ON AN INDIVIDUAL BASIS. NEITHER YOU NOR ${NAME_CAPS} MAY BRING CLAIMS AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS, REPRESENTATIVE, OR COLLECTIVE PROCEEDING. The arbitrator may only award relief on an individual basis. If a court finds this class action waiver unenforceable as to a specific claim, that claim may be litigated in state or federal court in San Francisco County, California; all other claims remain subject to arbitration.`,
      ),
    ),
    clause(
      "11.8",
      "Attorneys' Fees.",
      t(
        "Each party bears its own attorneys' fees unless the arbitrator finds a claim was frivolous or brought for an improper purpose.",
      ),
    ),
    clause(
      "11.9",
      "Batch Arbitration.",
      t(
        `If 100 or more substantially similar arbitration demands are filed against ${siteConfig.name} within a 30-day period by the same law firm or coordinated group, JAMS will batch them into groups of 100 and appoint one arbitrator per batch, with one set of fees per batch.`,
      ),
    ),
    clause(
      "11.10",
      "Opt-Out.",
      t(
        "You may opt out of this arbitration agreement within 30 days of first accepting these Terms by sending written notice to ",
      ),
      termsEmail,
      t(
        ". Your notice must include your name, the email address you use with the Site (if any), and a clear statement that you wish to opt out. Opting out does not affect any other part of these Terms.",
      ),
    ),
    clause(
      "11.11",
      "Severability.",
      t(
        "If any part of this arbitration agreement is found invalid, it will be modified to the minimum extent necessary to make it enforceable; the rest of the agreement remains in effect.",
      ),
    ),
  ),
];

export const termsPage: ProsePage = {
  description: `The rules for using ${siteConfig.name}, including how disputes are resolved.`,
  footnote: [generalLegalCredit],
  intro: [
    p(b(`Version ${TERMS_VERSION} Last revised:`), t(` ${LEGAL_EFFECTIVE_DATE}`)),
    p(
      t(
        `The website located at ${WEB_HOST}, together with our iOS and Android apps (collectively, the "`,
      ),
      b("Site"),
      t(`"), is owned and operated by ${siteConfig.author.name} ("`),
      b(siteConfig.name),
      t('," "'),
      b("us"),
      t('," "'),
      b("our"),
      t('," or "'),
      b("we"),
      t(
        '"). Certain features of the Site may be subject to additional guidelines or rules posted on the Site, which are incorporated by reference into these Terms.',
      ),
    ),
    p(
      t('These Terms of Use ("'),
      b("Terms"),
      t(
        '") govern your use of the Site. By accessing or using the Site, or by clicking "I agree" (or a similar button or checkbox) when that option is presented to you, you agree to these Terms on behalf of yourself or the entity you represent, and you confirm that you have the authority to do so. You must be at least 13 years old to use the Site. If you are under 18 (or the age of majority where you live), you may use the Site only with the permission and involvement of a parent or legal guardian, who agrees to these Terms on your behalf. If you do not agree to these Terms, please do not use the Site.',
      ),
    ),
    p(
      b("IMPORTANT – PLEASE READ SECTION 11 CAREFULLY."),
      t(
        " It contains an agreement to resolve disputes through binding individual arbitration instead of in court, and includes a waiver of class action rights and jury trial rights. You have 30 days to opt out of the arbitration agreement, as further described in Section 11.",
      ),
    ),
  ],
  path: "/terms",
  sections: termsSections,
  title: "Terms of Use",
};
