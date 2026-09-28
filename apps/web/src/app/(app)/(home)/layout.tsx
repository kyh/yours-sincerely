import { artProject, howItWorks, sitePages, siteSummary, whereItRuns } from "@/lib/agent/markdown";
import { siteConfig } from "@/lib/site-config";

const introLinks = [
  ...sitePages.filter((page) => page.href !== "/"),
  { href: "/llms.txt", label: "llms.txt", text: "a guide to this site for agents" },
];

/**
 * The feed streams in behind `loading.tsx`, so crawlers that do not run JS see
 * only its spinner. A layout renders outside that Suspense boundary, which puts
 * this copy in the initial HTML without changing what sighted visitors see.
 * Links stay out of the tab order so keyboard navigation is unchanged too.
 */
const HomeLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <section className="sr-only">
      <h1>{siteConfig.name}</h1>
      <p>{siteConfig.description}</p>
      <p>{siteSummary}</p>
      <p>{howItWorks}</p>
      <p>{artProject}</p>
      <p>{whereItRuns}</p>
      <ul>
        {introLinks.map((link) => (
          <li key={link.href}>
            <a href={link.href} tabIndex={-1}>
              {link.label}
            </a>
            : {link.text}
          </li>
        ))}
      </ul>
    </section>
    {children}
  </>
);

export default HomeLayout;
