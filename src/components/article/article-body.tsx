// src/components/article/article-body.tsx
// Server-side Markdown renderer. The .article-body wrapper carries all
// typography styles; the first <p> is auto-styled as a lead via CSS
// :first-of-type in globals.css. External links open in a new tab.

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps } from "react";

type AnchorProps = ComponentProps<"a">;

function ExternalLink(props: AnchorProps) {
  const { href = "#", children, ...rest } = props;
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <a
      {...rest}
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ExternalLink,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
