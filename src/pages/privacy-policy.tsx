import { AppShell, Breadcrumbs, Container, Group, Image, Stack, Text, Title } from "@mantine/core"
import { FaCaretRight } from "react-icons/fa6";
import { Link } from "react-router";
import Logo from '@/assets/mittelware-logo.png';

const PrivacyPolicy = () => {
  return (
    <AppShell
      header={{ height: 60 }}
    >
      <AppShell.Header className="top-0 !bg-sky-50/50 bg-opacity-50 drop-shadow-sm drop-shadow-gray-100 relative backdrop-blur-xl" pt="md" px="md" pb="lg">
        <Group justify="space-between" align="center">
          <Link to="/rules">
            <Group gap='xs' align="top">
              <Image src={Logo} h={30} w={140} fit='contain' />
              <FaCaretRight className="self-center" />
              <Text c='gray' size="lg" fw={400}>Intercept</Text>
            </Group>
          </Link>
        </Group>
      </AppShell.Header>
      <AppShell.Main className='bg-gray-50 bg-[linear-gradient(rgba(255,255,255,.3),rgba(255,255,255,.3)),url(/bg.png)]'>
        <Container size='lg' p={0} pb='xl' className='shadow-lg bg-white' mih={'calc(100vh - 60px)'}>
          <Stack p='xl'>
            <Breadcrumbs separator="/">
              Privacy Policy
            </Breadcrumbs>
            <Group justify="space-between">
              <Group>
                <Title>Privacy Policy</Title>
              </Group>
              <Group>

              </Group>
            </Group>
            <Stack mt="xl" gap="md">
              <Text>
                Intercept by Mittelware ("the Extension") respects your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our Chrome Extension and related services. We use Supabase as our backend database to store your rules and related data securely.
              </Text>
              <Title order={2} size="h4" mt="md">1. Information We Collect</Title>
              <ul style={{ marginLeft: 24 }}>
                <li><Text span>Authentication information: We store your authentication tokens securely to sync your rules with your Mittelware account.</Text></li>
                <li><Text span>Rules data: Rules you create, enable, or disable are stored in our Supabase database and associated with your Mittelware account to provide synchronization across devices and browsers.</Text></li>
                <li><Text span>Usage data: Minimal usage data may be collected to improve functionality.</Text></li>
              </ul>
              <Title order={2} size="h4" mt="md">2. What We Do Not Collect</Title>
              <ul style={{ marginLeft: 24 }}>
                <li><Text span>We do not collect personally identifiable information beyond what is required for authentication.</Text></li>
                <li><Text span>We do not collect health, financial, or payment information.</Text></li>
                <li><Text span>We do not collect your personal communications, location, or web history.</Text></li>
              </ul>
              <Title order={2} size="h4" mt="md">3. How We Use Information</Title>
              <ul style={{ marginLeft: 24 }}>
                <li><Text span>To provide synchronization between your Mittelware account and the Extension.</Text></li>
                <li><Text span>To apply and manage your network rules in the browser.</Text></li>
                <li><Text span>To improve and maintain the Extension.</Text></li>
              </ul>
              <Title order={2} size="h4" mt="md">4. Data Sharing</Title>
              <ul style={{ marginLeft: 24 }}>
                <li><Text span>We do not sell your data.</Text></li>
                <li><Text span>We do not share your data with third parties, except as required by law.</Text></li>
              </ul>
              <Title order={2} size="h4" mt="md">5. Data Storage</Title>
              <ul style={{ marginLeft: 24 }}>
                <li><Text span>Rules and related data are stored securely in our Supabase database and linked to your Mittelware account. Some settings may also be stored locally in your browser for performance and offline access.</Text></li>
                <li><Text span>Authentication tokens are used only for communicating securely with Mittelware and Supabase servers.</Text></li>
              </ul>
              <Title order={2} size="h4" mt="md">6. Security</Title>
              <Text>We take appropriate measures to protect your data, but please note that no system is 100% secure.</Text>
              <Title order={2} size="h4" mt="md">7. Contact Us</Title>
              <Text>If you have any questions about this Privacy Policy, you can contact us at:<br /><b>support@mittelware.com</b></Text>
            </Stack>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
};

export default PrivacyPolicy;