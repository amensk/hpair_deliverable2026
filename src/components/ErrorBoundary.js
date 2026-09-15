import React from 'react';
import { useI18n } from '../i18n';

const Fallback = ({ error }) => {
  const { t } = useI18n();
  return (
    <div className="container" style={{ paddingBlock: 48 }}>
      <div className="card card--pad" role="alert">
        <span className="eyebrow">{t('boundary.eyebrow')}</span>
        <h2>{t('boundary.title')}</h2>
        <p style={{ marginTop: 8 }}>{t('boundary.body', { email: 'cqiu@college.harvard.edu' })}</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn--primary" style={{ width: 'auto' }} onClick={() => window.location.reload()}>
            {t('common.reload')}
          </button>
        </div>
        <details style={{ marginTop: 18, fontSize: '0.8rem', color: 'var(--hp-ink-muted)' }}>
          <summary>{t('boundary.details')}</summary>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{String(error?.message || error)}</pre>
        </details>
      </div>
    </div>
  );
};

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
    return <Fallback error={this.state.error} />;
  }
}

export default ErrorBoundary;
