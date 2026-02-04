"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle } from "lucide-react";
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

export default function GeneratePage() {
  const store = useGeneratorStore();
  const [downloadUrl, setDownloadUrl] = useState<string | undefined>();
  const [filename, setFilename] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const hasSubtopics = store.subtopicIds.length > 0;

  const handlePreview = useCallback(async () => {
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

  const handleGenerate = useCallback(async () => {
    if (!hasSubtopics) return;
    setError(null);
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
              Back
            </Link>
            <span className="font-display text-lg font-bold text-slate-800">
              teacher<span className="text-subject-math">.ninja</span>
            </span>
          </div>
          <button
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
          <div className="w-full lg:w-[420px] shrink-0 space-y-6">
            <div className="rounded-xl bg-white border border-slate-200 shadow-paper p-5 space-y-6">
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

            <div className="rounded-xl bg-white border border-slate-200 shadow-paper p-5 space-y-6">
              <OptionsPanel
                options={store.options}
                onOptionChange={store.setOption}
                subject={store.subject}
              />
            </div>

            <div className="rounded-xl bg-white border border-slate-200 shadow-paper p-5 space-y-6">
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
              onPreview={handlePreview}
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
              <PreviewPane
                html={store.previewHtml}
                isLoading={store.isPreviewLoading}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
