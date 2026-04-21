"use client";

import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-text-muted">Something went wrong.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 text-xs text-brand hover:underline"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
