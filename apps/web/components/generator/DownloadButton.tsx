"use client";

import { Download, Check, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
  downloadUrl?: string;
  filename?: string;
  disabled?: boolean;
}

export function DownloadButton({
  onGenerate,
  isGenerating,
  downloadUrl,
  filename,
  disabled,
}: DownloadButtonProps) {
  return (
    <div className="space-y-3">
      {downloadUrl ? (
        <>
          <a
            href={downloadUrl}
            download={filename}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
          >
            <Check className="w-5 h-5" />
            Download PDF
          </a>
          <button
            onClick={onGenerate}
            className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Generate new worksheet
          </button>
        </>
      ) : (
        <Button
          onClick={onGenerate}
          variant="primary"
          size="lg"
          isLoading={isGenerating}
          className="w-full"
          disabled={disabled}
        >
          <FileText className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating PDF..." : "Generate & Download PDF"}
        </Button>
      )}
      
      {disabled && (
        <p className="text-xs text-slate-400 text-center">
          Select at least one subtopic to generate a worksheet
        </p>
      )}
    </div>
  );
}
