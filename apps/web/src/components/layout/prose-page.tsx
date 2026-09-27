import { Fragment } from "react";

import { PageContent, PageHeader } from "@/components/layout/page-layout";

import type { Block, Inline, ProsePage as ProsePageData } from "@/lib/agent/site-pages";

const InlineContent = ({ content }: { content: Inline[] }) =>
  content.map((part, index) =>
    part.kind === "text" ? (
      part.text
    ) : (
      <a
        key={`${index}-${part.href}`}
        href={part.href}
        {...(part.href.startsWith("http") && { rel: "noopener noreferrer", target: "_blank" })}
      >
        {part.label}
      </a>
    ),
  );

const BlockContent = ({ block }: { block: Block }) =>
  block.kind === "paragraph" ? (
    <p>
      <InlineContent content={block.content} />
    </p>
  ) : (
    <ul>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );

export const ProsePage = ({ page }: { page: ProsePageData }) => (
  <>
    <PageHeader title={page.title} />
    <PageContent className="prose dark:prose-invert">
      {page.updated ? <p className="text-xs">Last Updated: {page.updated}</p> : null}
      {page.sections.map((section) => (
        <Fragment key={section.heading}>
          <h4>{section.heading}</h4>
          {section.blocks.map((block, index) => (
            <BlockContent key={`${section.heading}-${index}`} block={block} />
          ))}
        </Fragment>
      ))}
    </PageContent>
  </>
);
