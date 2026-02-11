"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, RefreshCw } from "lucide-react";
import { useGeneratorStore } from "@/lib/store";
import { generatePreview, generateWorksheet } from "@/lib/api";
import { SubjectSelector } from "@/components/generator/SubjectSelector";
import { GradeLevelSelector } from "@/components/generator/GradeLevelSelector";
import { TopicSelector } from "@/components/generator/TopicSelector";
import { OptionsPanel } from "@/components/generator/OptionsPanel";
import { DifficultySelector } from "@/components/generator/DifficultySelector";
import { ProblemCountSlider } from "@/components/generator/ProblemCountSlider";
import { PersonalizationPanel } from "@/components/generator/PersonalizationPanel";
import { PreviewPane } from "@/components/generator/PreviewPane";
import { DownloadButton } from "@/components/generator/DownloadButton";
import { HelpModal } from "@/components/generator/HelpModal";

// Debounce delay for auto-preview (ms)
const PREVIEW_DEBOUNCE_MS = 800;

export default function GeneratePage() {
  const store = useGeneratorStore();
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfigRef = useRef<string>("");

  const hasSubtopics = store.subtopicIds.length > 0;

  // Generate preview function
  const doPreview = useCallback(async () => {
    if (!hasSubtopics) return;
    setError(null);
    store.setIsPreviewLoading(true);
    try {
      const html = await generatePreview(store.getConfig());
      store.setPreviewHtml(html);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate preview"
      );
    } finally {
      store.setIsPreviewLoading(false);
    }
  }, [store, hasSubtopics]);

  // Auto-preview when config changes (debounced)
  useEffect(() => {
    if (!hasSubtopics) return;

    // Create a config fingerprint to detect changes
    const configFingerprint = JSON.stringify({
      subject: store.subject,
      topicId: store.topicId,
      subtopicIds: store.subtopicIds,
      problemCount: store.problemCount,
      difficulty: store.difficulty,
      options: store.options,
      grade: store.grade,
    });

    // Skip if config hasn't changed
    if (configFingerprint === lastConfigRef.current) return;
    lastConfigRef.current = configFingerprint;

    // Clear any pending preview
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }

    // Schedule new preview
    previewTimeoutRef.current = setTimeout(() => {
      doPreview();
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, [
    store.subject,
    store.topicId,
    store.subtopicIds,
    store.problemCount,
    store.difficulty,
    store.options,
    store.grade,
    hasSubtopics,
    doPreview,
  ]);

  // Generate initial preview on mount
  useEffect(() => {
    if (hasSubtopics && !store.previewHtml) {
      doPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!hasSubtopics) return;
    setError(null);
    setDownloadUrl(undefined);
    store.setIsGenerating(true);
    try {
      const result = await generateWorksheet(store.getConfig());
      setDownloadUrl(result.downloadUrl);
      setFilename(result.filename);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate worksheet"
      );
    } finally {
      store.setIsGenerating(false);
    }
  }, [store, hasSubtopics]);

  // Manual refresh preview
  const handleRefreshPreview = useCallback(() => {
    doPreview();
  }, [doPreview]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <span className="font-display text-lg font-bold text-slate-800">
              teacher<span className="text-subject-math">.ninja</span>
            </span>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Help</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Configure panel */}
          <div className="w-full lg:w-[420px] shrink-0 space-y-5">
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5 space-y-5">
              <h2 className="font-display text-lg font-semibold text-slate-800">
                Configure Worksheet
              </h2>

              <SubjectSelector
                value={store.subject}
                onChange={store.setSubject}
              />

              <GradeLevelSelector
                value={store.grade}
                onChange={store.setGrade}
              />

              <TopicSelector
                subject={store.subject}
                topicId={store.topicId}
                subtopicIds={store.subtopicIds}
                onTopicChange={store.setTopicId}
                onSubtopicToggle={store.toggleSubtopic}
              />

              <ProblemCountSlider
                value={store.problemCount}
                onChange={store.setProblemCount}
              />

              <DifficultySelector
                value={store.difficulty}
                onChange={store.setDifficulty}
              />
            </div>

            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
              <OptionsPanel
                options={store.options}
                onOptionChange={store.setOption}
                subject={store.subject}
                topicId={store.topicId}
                subtopicIds={store.subtopicIds}
              />
            </div>

            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
              <PersonalizationPanel
                config={store.personalization}
                onChange={store.setPersonalization}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <DownloadButton
              onGenerate={handleGenerate}
              isGenerating={store.isGenerating}
              downloadUrl={downloadUrl}
              filename={filename}
              disabled={!hasSubtopics}
            />
          </div>

          {/* Preview panel */}
          <div className="flex-1 min-w-0">
            <div className="lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-600">
                  Live Preview
                  {store.isPreviewLoading && (
                    <span className="ml-2 text-slate-400">(updating...)</span>
                  )}
                </h3>
                <button
                  onClick={handleRefreshPreview}
                  disabled={store.isPreviewLoading || !hasSubtopics}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Generate new problems"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${store.isPreviewLoading ? 'animate-spin' : ''}`} />
                  New problems
                </button>
              </div>
              <PreviewPane
                html={store.previewHtml}
                isLoading={store.isPreviewLoading}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
