import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'
import App from './App'
import ErrorBoundary from './pages/error/error-boundary'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<p>Something went wrong!</p>}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
