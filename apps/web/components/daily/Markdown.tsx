import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
}

/**
 * Light wrapper around react-markdown styled to match the daily theme.
 * Headers are smaller than default; tables get borders; links are
 * blue; code spans get a soft background.
 */
export function Markdown({ content }: Props) {
  return (
    <div className="prose-daily">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="font-display text-3xl font-bold text-slate-900 mt-8 mb-4 first:mt-0" {...props} />
          ),
          h2: (props) => (
            <h2 className="font-display text-xl font-bold text-slate-900 mt-8 mb-3" {...props} />
          ),
          h3: (props) => (
            <h3 className="font-display text-base font-semibold text-slate-800 mt-6 mb-2" {...props} />
          ),
          p: (props) => (
            <p className="text-slate-700 leading-relaxed mb-4" {...props} />
          ),
          a: (props) => (
            <a className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700" {...props} />
          ),
          ul: (props) => (
            <ul className="list-disc pl-6 space-y-1 mb-4 text-slate-700" {...props} />
          ),
          ol: (props) => (
            <ol className="list-decimal pl-6 space-y-1 mb-4 text-slate-700" {...props} />
          ),
          code: ({ className, children, ...rest }) => {
            const isBlock = /language-/.test(className ?? "");
            if (isBlock) {
              return (
                <code className="block bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-mono overflow-x-auto" {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono" {...rest}>
                {children}
              </code>
            );
          },
          pre: (props) => <pre className="mb-4" {...props} />,
          table: (props) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-slate-50" {...props} />,
          th: (props) => (
            <th className="text-left px-3 py-2 border border-slate-200 font-semibold text-slate-800" {...props} />
          ),
          td: (props) => (
            <td className="px-3 py-2 border border-slate-200 text-slate-700" {...props} />
          ),
          blockquote: (props) => (
            <blockquote className="border-l-4 border-indigo-200 bg-indigo-50/40 pl-4 py-2 mb-4 text-slate-600 italic" {...props} />
          ),
          hr: () => <hr className="my-8 border-slate-200" />,
          strong: (props) => (
            <strong className="font-semibold text-slate-900" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
