"use client";

import { useMemo, useEffect, useRef } from "react";
import { FileText, Loader2 } from "lucide-react";
import clsx from "clsx";

interface PreviewPaneProps {
  html: string;
  isLoading: boolean;
  className?: string;
}

export function PreviewPane({ html, isLoading, className }: PreviewPaneProps) {
  const prevBlobUrl = useRef<string | null>(null);

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

  // Clean up old blob URLs to prevent memory leaks
  useEffect(() => {
    if (prevBlobUrl.current && prevBlobUrl.current !== iframeSrc) {
      URL.revokeObjectURL(prevBlobUrl.current);
    }
    prevBlobUrl.current = iframeSrc;

    return () => {
      if (prevBlobUrl.current) {
        URL.revokeObjectURL(prevBlobUrl.current);
      }
    };
  }, [iframeSrc]);

  return (
    <div
      className={clsx(
        "rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      {/* Preview content */}
      <div className="relative min-h-[500px] lg:min-h-[700px]">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Updating preview...</span>
            </div>
          </div>
        )}

        {iframeSrc ? (
          <iframe
            src={iframeSrc}
            className="w-full h-[500px] lg:h-[700px] border-0"
            title="Worksheet Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8">
            <FileText className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm text-center">
              Select a subtopic to see your worksheet preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
