import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    // In production: send to Sentry / logging service
    console.error('ErrorBoundary caught:', info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-white text-center">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold mb-2">Bir şeyler ters gitti</h2>
          <p className="text-white/50 mb-6 text-sm">{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.reload() }}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-2xl font-semibold transition-all"
          >
            Yenile
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
