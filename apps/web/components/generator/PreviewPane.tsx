"use client";

import { useMemo } from "react";
import { FileText, Loader2 } from "lucide-react";
import clsx from "clsx";

interface PreviewPaneProps {
  html: string;
  isLoading: boolean;
  className?: string;
}

export function PreviewPane({ html, isLoading, className }: PreviewPaneProps) {
  // Create a blob URL for the iframe to ensure complete style isolation
  const iframeSrc = useMemo(() => {
    if (!html) return null;
    
    // Wrap the HTML in a complete document if it doesn't have <html> tag
    const fullHtml = html.includes("<html") ? html : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;
    
    const blob = new Blob([fullHtml], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [html]);

  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-200 bg-white shadow-paper overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <FileText className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-600">
          Worksheet Preview
        </span>
        {isLoading && (
          <Loader2 className="w-3.5 h-3.5 text-subject-math animate-spin ml-auto" />
        )}
      </div>

      {/* Preview content */}
      <div className="relative min-h-[400px] lg:min-h-[600px]">
        {isLoading && !html ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3" />
            <p className="text-sm">Generating preview...</p>
          </div>
        ) : iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="w-full h-[600px] lg:h-[800px] border-0"
            title="Worksheet Preview"
            sandbox="allow-same-origin"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm text-center">
              Configure your worksheet options and click
              <br />
              <strong>&quot;Generate Preview&quot;</strong> to see it here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
