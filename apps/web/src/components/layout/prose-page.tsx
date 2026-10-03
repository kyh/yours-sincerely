import { Fragment } from "react";
import Link from "next/link";

import { PageContent, PageHeader } from "@/components/layout/page-layout";
import { headingId } from "@/lib/agent/site-pages";

import type { Block, Inline, ProsePage as ProsePageData } from "@/lib/agent/site-pages";

const InlinePart = ({ part }: { part: Inline }) => {
  switch (part.kind) {
    case "text": {
      return part.text;
    }
    case "strong": {
      return <strong>{part.text}</strong>;
    }
    case "link": {
      if (part.href.startsWith("/")) {
        return <Link href={part.href}>{part.label}</Link>;
      }
      return (
        <a
          href={part.href}
          {...(part.href.startsWith("http") && { rel: "noopener noreferrer", target: "_blank" })}
        >
          {part.label}
        </a>
      );
    }
    default: {
      const exhaustive: never = part;
      throw new Error(`Unknown inline ${String(exhaustive)}`);
    }
  }
};

const InlineContent = ({ content }: { content: Inline[] }) =>
  content.map((part, index) => <InlinePart key={index} part={part} />);

const BlockContent = ({ block }: { block: Block }) => {
  switch (block.kind) {
    case "paragraph": {
      return (
        <p>
          <InlineContent content={block.content} />
        </p>
      );
    }
    case "list": {
      return (
        <ul>
          {block.items.map((item, index) => (
            <li key={index}>
              <InlineContent content={item} />
            </li>
          ))}
        </ul>
      );
    }
    case "table": {
      // The CCPA chart has five wide columns. On a phone the table scrolls, not the
      // page: without inline-size containment its width would widen the grid column.
      return (
        <div className="overflow-x-auto contain-inline-size">
          <table>
            <thead>
              <tr>
                {block.head.map((cell) => (
                  <th key={cell} scope="col">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    default: {
      const exhaustive: never = block;
      throw new Error(`Unknown block ${String(exhaustive)}`);
    }
  }
};

const Blocks = ({ blocks, scope }: { blocks: Block[]; scope: string }) =>
  blocks.map((block, index) => <BlockContent key={`${scope}-${index}`} block={block} />);

/** Headings carry `headingId` so a page's `#links` land on them, held clear of
    the sticky page header. */
export const ProsePage = ({ page }: { page: ProsePageData }) => (
  <>
    <PageHeader title={page.title} />
    <PageContent className="prose dark:prose-invert">
      <Blocks blocks={page.intro ?? []} scope="intro" />
      {page.sections.map((section) => (
        <Fragment key={section.heading}>
          <h4
            id={headingId(section.heading)}
            className="scroll-mt-[calc(var(--header-height)_+_1rem)]"
          >
            {section.heading}
          </h4>
          <Blocks blocks={section.blocks} scope={section.heading} />
        </Fragment>
      ))}
      {page.footnote ? (
        <>
          <hr />
          <Blocks blocks={page.footnote} scope="footnote" />
        </>
      ) : null}
    </PageContent>
  </>
);
