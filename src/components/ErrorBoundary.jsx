import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-100 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4">
              An unexpected error occurred while rendering the app.
            </p>
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-left text-xs font-mono overflow-auto max-h-48 mb-6 border border-slate-800">
              <p className="text-red-400 font-semibold mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-slate-400 whitespace-pre-wrap text-[11px]">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#0EA5E0] to-[#38BDF8] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-glow hover:opacity-95 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
