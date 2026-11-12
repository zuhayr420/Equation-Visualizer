import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  math?: string;
  children?: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({
  math,
  children,
  block = false,
  className = '',
}) => {
  const content = math || children || '';

  const html = useMemo(() => {
    if (!content) return '';

    // If string already has $ or $$, parse mixed markdown-latex
    if (content.includes('$')) {
      return content.replace(/\$\$([\s\S]*?)\$\$/g, (_, eq) => {
        try {
          return katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false });
        } catch {
          return eq;
        }
      }).replace(/\$([^\$]+?)\$/g, (_, eq) => {
        try {
          return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
        } catch {
          return eq;
        }
      });
    }

    try {
      return katex.renderToString(content, {
        displayMode: block,
        throwOnError: false,
      });
    } catch {
      return content;
    }
  }, [content, block]);

  return (
    <span
      className={`inline-block font-math ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
