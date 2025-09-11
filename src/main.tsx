import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import AuthLayout from '@/layouts/auth.tsx'
import Login from '@/pages/auth/login.tsx'
import Logout from '@/pages/auth/logout.tsx'
import { MantineProvider } from '@mantine/core'
import Notification from '@/components/notification/notification.tsx'
import ErrorBoundary from './pages/error/error-boundary.tsx'
import '@mantine/core/styles.css';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<p>Something went wrong!</p>}>
      <MantineProvider>
        <Notification />
        <BrowserRouter>
          <Routes>
            <Route index element={<App />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/login" element={<Logout />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </ErrorBoundary>
  </StrictMode>,
)
