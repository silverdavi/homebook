"use client";

import { Download, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  onGenerate: () => void;
  onPreview: () => void;
  isGenerating: boolean;
  downloadUrl?: string;
  disabled?: boolean;
}

export function DownloadButton({
  onGenerate,
  onPreview,
  isGenerating,
  downloadUrl,
  disabled,
}: DownloadButtonProps) {
  return (
    <div className="space-y-3">
      <Button
        onClick={onPreview}
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={disabled}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Generate Preview
      </Button>
      <Button
        onClick={onGenerate}
        variant="primary"
        size="lg"
        isLoading={isGenerating}
        className="w-full"
        disabled={disabled}
      >
        {downloadUrl ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Download Ready
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Generate PDF
          </>
        )}
      </Button>
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="block text-center text-sm text-subject-math hover:underline"
        >
          Click to download worksheet
        </a>
      )}
    </div>
  );
}
