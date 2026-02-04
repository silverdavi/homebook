"use client";

import { X, BookOpen, Lightbulb, FileText, Download } from "lucide-react";
import { useEffect } from "react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">
            How to Use Worksheet Generator
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto max-h-[calc(85vh-120px)] space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                1. Choose Subject & Topic
              </h3>
              <p className="text-sm text-slate-600">
                Select a subject (Math, Chemistry, Biology) and then choose a specific topic.
                For Math, you can pick Fractions, Arithmetic, or Decimals & Percentages.
                Select one or more subtopics to include in your worksheet.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                2. Configure Options
              </h3>
              <p className="text-sm text-slate-600">
                Adjust the number of problems, difficulty level, and optional features:
              </p>
              <ul className="mt-2 text-sm text-slate-600 space-y-1 list-disc list-inside">
                <li><strong>Answer Key</strong> - Include answers at the end</li>
                <li><strong>Hints</strong> - Add helpful hints for students</li>
                <li><strong>Worked Examples</strong> - Show step-by-step solutions</li>
                <li><strong>Word Problems</strong> - Include story-based problems (Math only)</li>
                <li><strong>Intro Page</strong> - AI-generated concept explanation</li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                3. Preview Your Worksheet
              </h3>
              <p className="text-sm text-slate-600">
                Click <strong>"Generate Preview"</strong> to see how your worksheet will look.
                The preview shows the actual problems that will be generated.
                You can adjust options and regenerate until you're satisfied.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Download className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-1">
                4. Generate & Download PDF
              </h3>
              <p className="text-sm text-slate-600">
                Click <strong>"Generate Worksheet"</strong> to create a print-ready PDF.
                The PDF is optimized for standard paper sizes and includes all your
                selected options. Download and print for your students!
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-slate-50 rounded-xl p-4 mt-4">
            <h3 className="font-semibold text-slate-800 mb-2">Tips</h3>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>• Add a student name and date in Personalization for custom worksheets</li>
              <li>• Use "Mixed" difficulty for varied problem complexity</li>
              <li>• Each generation creates fresh, unique problems</li>
              <li>• Standards alignment shows which Common Core standards are covered</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
