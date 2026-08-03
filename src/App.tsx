import { MantineProvider, createTheme, Button, TextInput, Textarea, Select, MultiSelect, Card } from '@mantine/core'
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

const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 'sm',
  radius: {
    xs: '4px',
    sm: '6px',
    md: '10px',
    lg: '18px',
    xl: '34px',
  },
  fontFamily: 'Inter, sans-serif',
  fontFamilyMonospace: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  components: {
    Button: Button.extend({ defaultProps: { size: 'sm' } }),
    TextInput: TextInput.extend({ defaultProps: { size: 'sm' } }),
    Textarea: Textarea.extend({ defaultProps: { size: 'sm' } }),
    Select: Select.extend({ defaultProps: { size: 'sm' } }),
    MultiSelect: MultiSelect.extend({ defaultProps: { size: 'sm' } }),
    Card: Card.extend({ defaultProps: { p: 'md', radius: 'md', shadow: 'md', bg: 'var(--mantine-color-default)' } }),
  },
});

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider defaultColorScheme="light" theme={theme}>
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
              <Route path="create" element={<RuleForm />} />
              <Route path=":id" element={<RuleForm />} />
            </Route>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  )
}

export default App
