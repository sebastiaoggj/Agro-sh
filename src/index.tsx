import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#f8fafc', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Algo deu errado na aplicação.</h1>
          <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', maxWidth: '600px', overflow: 'auto', marginBottom: '24px', border: '1px solid #fecaca' }}>
            <p style={{ margin: 0, fontFamily: 'monospace' }}>{this.state.error?.message || 'Erro desconhecido'}</p>
          </div>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', cursor: 'pointer', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            Tentar Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);