// @ts-nocheck
import React from 'react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: (error: Error, errorInfo: React.ErrorInfo) => React.ReactNode;
}

export interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.error && this.state.errorInfo) {
      return this.props.fallback(this.state.error, this.state.errorInfo);
    }

    return this.props.children;
  }
}
