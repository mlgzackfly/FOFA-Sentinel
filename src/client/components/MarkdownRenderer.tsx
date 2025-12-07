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
          h1: ({ ...props }) => <h1 className="markdown-h1" {...props} />,
          h2: ({ ...props }) => <h2 className="markdown-h2" {...props} />,
          h3: ({ ...props }) => <h3 className="markdown-h3" {...props} />,
          h4: ({ ...props }) => <h4 className="markdown-h4" {...props} />,
          h5: ({ ...props }) => <h5 className="markdown-h5" {...props} />,
          h6: ({ ...props }) => <h6 className="markdown-h6" {...props} />,
          // Customize paragraph
          p: ({ ...props }) => <p className="markdown-p" {...props} />,
          // Customize list
          ul: ({ ...props }) => <ul className="markdown-ul" {...props} />,
          ol: ({ ...props }) => <ol className="markdown-ol" {...props} />,
          li: ({ ...props }) => <li className="markdown-li" {...props} />,
          // Customize code
          code: ({ className, children, ...props }) => {
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
          pre: ({ ...props }) => <pre className="markdown-pre" {...props} />,
          // Customize links
          a: ({ ...props }) => (
            <a className="markdown-a" {...props} target="_blank" rel="noopener noreferrer" />
          ),
          // Customize blockquote
          blockquote: ({ ...props }) => <blockquote className="markdown-blockquote" {...props} />,
          // Customize horizontal rule
          hr: ({ ...props }) => <hr className="markdown-hr" {...props} />,
          // Customize strong and emphasis
          strong: ({ ...props }) => <strong className="markdown-strong" {...props} />,
          em: ({ ...props }) => <em className="markdown-em" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
