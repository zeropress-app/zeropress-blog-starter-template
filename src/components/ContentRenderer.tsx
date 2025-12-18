import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ContentFormat } from "@/types/api";

interface ContentRendererProps {
  content: string;
  format: ContentFormat;
  className?: string;
}

export const ContentRenderer = ({ content, format, className = "" }: ContentRendererProps) => {
  if (format === "markdown") {
    return (
      <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // For 'html' and 'visual' formats, render as HTML
  return (
    <div 
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
