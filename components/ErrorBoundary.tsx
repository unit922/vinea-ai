import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Vinetelligence: Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    localStorage.removeItem('vinea_active_view');
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertTriangle className="text-red-500" size={40} />
            </div>
            
            <h1 className="text-3xl font-serif text-white mb-4 italic">System Pulse Interrupted</h1>
            <p className="text-stone-400 text-sm mb-8 leading-relaxed">
              We encountered an internal error that interrupted the beverage intelligence flow. 
              Restoring the system may require a reload.
            </p>
            
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 mb-8 text-left">
              <p className="text-[10px] text-stone-500 font-mono uppercase mb-2 tracking-widest">Error Signature</p>
              <p className="text-xs text-red-400 font-mono break-all capitalize">
                {this.state.error?.message || 'Unknown technical conflict'}
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-amber-500 text-stone-950 text-xs font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-xl"
              >
                <RefreshCcw size={14} />
                Restore Pulse
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full py-4 bg-transparent border border-stone-800 text-stone-400 text-xs font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-stone-900 transition-all"
              >
                <Home size={14} />
                Return to Base
              </button>
            </div>
            
            <p className="mt-12 text-[10px] text-stone-600 font-black uppercase tracking-widest leading-none">
              Vinetelligence Intelligence System
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
