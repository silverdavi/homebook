"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  gameName: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center px-4">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {this.props.gameName} crashed
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6 max-w-sm">
            Something went wrong. Your high scores are saved.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
            <Link
              href="/games"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
            >
              Back to Games
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
