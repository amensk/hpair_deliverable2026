import React from 'react';

/** Catches render errors so a bug in one section never blanks the whole page. */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Render error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="container" style={{ paddingBlock: 48 }}>
        <div className="card card--pad" role="alert">
          <span className="eyebrow">Something went wrong</span>
          <h2>This page hit an unexpected error.</h2>
          <p style={{ marginTop: 8 }}>
            Your draft is saved on this device. Reload to continue where you left off. If it keeps happening, email{' '}
            <a href="mailto:cqiu@college.harvard.edu">cqiu@college.harvard.edu</a>.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn--primary" style={{ width: 'auto' }} onClick={() => window.location.reload()}>
              Reload page
            </button>
          </div>
          <details style={{ marginTop: 18, fontSize: '0.8rem', color: 'var(--hp-ink-muted)' }}>
            <summary>Technical details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{String(this.state.error?.message || this.state.error)}</pre>
          </details>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
