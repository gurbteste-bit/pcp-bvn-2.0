import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          width: '100vw', height: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: '#1B1B1F', flexDirection: 'column', gap: 16,
          fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#C41230' }}>BVN PCP</div>
          <div style={{ fontSize: 15, color: '#EF4444', fontWeight: 700 }}>
            Erro ao inicializar o aplicativo
          </div>
          <div style={{ fontSize: 12, color: '#9999AA', fontFamily: 'monospace', maxWidth: 500, textAlign: 'center', padding: '0 20px', lineHeight: 1.6 }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px', borderRadius: 8, border: 'none',
              background: '#C41230', color: '#fff', cursor: 'pointer',
              fontSize: 15, fontWeight: 800, letterSpacing: '0.05em',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
