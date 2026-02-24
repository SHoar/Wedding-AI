import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, onRetry } = this.props;
      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            onRetry={
              onRetry || (() => this.setState({ hasError: false, error: null }))
            }
          />
        );
      }
      return (
        <div className="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <h2 className="text-lg font-semibold text-rose-800">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-rose-700">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500"
            onClick={() => this.setState({ hasError: false, error: null })}
            type="button"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
