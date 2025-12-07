import ReactMarkdown from 'react-markdown';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        components={{
          // Customize heading styles
          h1: ({ node, ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="markdown-h3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="markdown-h4" {...props} />,
          h5: ({ node, ...props }) => <h5 className="markdown-h5" {...props} />,
          h6: ({ node, ...props }) => <h6 className="markdown-h6" {...props} />,
          // Customize paragraph
          p: ({ node, ...props }) => <p className="markdown-p" {...props} />,
          // Customize list
          ul: ({ node, ...props }) => <ul className="markdown-ul" {...props} />,
          ol: ({ node, ...props }) => <ol className="markdown-ol" {...props} />,
          li: ({ node, ...props }) => <li className="markdown-li" {...props} />,
          // Customize code
          code: ({ node, className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="markdown-code-inline" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="markdown-code-block" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ node, ...props }) => <pre className="markdown-pre" {...props} />,
          // Customize links
          a: ({ node, ...props }) => <a className="markdown-a" {...props} target="_blank" rel="noopener noreferrer" />,
          // Customize blockquote
          blockquote: ({ node, ...props }) => <blockquote className="markdown-blockquote" {...props} />,
          // Customize horizontal rule
          hr: ({ node, ...props }) => <hr className="markdown-hr" {...props} />,
          // Customize strong and emphasis
          strong: ({ node, ...props }) => <strong className="markdown-strong" {...props} />,
          em: ({ node, ...props }) => <em className="markdown-em" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

