import { MantineProvider } from '@mantine/core'
import Notification from '@/components/notification/notification'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router'
import AuthLayout from '@/layouts/auth'
import Login from '@/pages/auth/login'
import Logout from '@/pages/auth/logout'
import { QueryClientProvider } from '@tanstack/react-query'
import Callback from '@/pages/auth/callback'
import queryClient from '@/services/tanstack/client'
import RulesList from '@/pages/rules/list'
import { ProtectedLayout } from './layouts/protected'
import RuleForm from './pages/rules/form'
import PrivacyPolicy from './pages/privacy-policy'

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={{
        fontFamily: 'Inter, sans-serif',
      }}>
        <Notification />
        <BrowserRouter>
          <Routes>
            <Route index element={<Navigate to="/rules" replace />} />
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="/callback" element={<Callback />} />
            </Route>
            <Route path="/rules" element={<ProtectedLayout />}>
              <Route index element={<RulesList />} />
              <Route path=":ruleType/:id" element={<RuleForm />} />
            </Route>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  )
}

export default App
