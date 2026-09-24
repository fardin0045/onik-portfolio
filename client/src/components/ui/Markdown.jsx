import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils.js';

/**
 * Safe Markdown renderer. Raw HTML is NOT rendered (react-markdown default) and
 * unsafe URL schemes (javascript:, data:) are stripped – so admin-entered content
 * cannot inject scripts.
 */
export function Markdown({ children, className }) {
  if (!children) return null;
  return (
    <div className={cn('prose-content', className)}>
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ node: _node, href, children: c, ...props }) => (
            <a href={href} {...props} {...(/^https?:\/\//.test(href || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {c}
            </a>
          ),
          img: ({ node: _node, alt, ...props }) => <img alt={alt || ''} loading="lazy" decoding="async" {...props} />,
          h1: ({ node: _node, ...props }) => <h2 {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
