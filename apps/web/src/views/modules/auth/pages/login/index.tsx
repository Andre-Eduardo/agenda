import { createFileRoute } from '@tanstack/react-router';
import { 
  Box, 
  Button, 
  Checkbox, 
  TextInput, 
  PasswordInput, 
  Title, 
  Text, 
  Anchor, 
  Flex,
  Divider
} from '@mantine/core';
import { 
  backgroundContainerStyle, 
  backgroundImageStyle, 
  backgroundOverlayStyle, 
  mainWrapperStyle, 
  loginCardStyle, 
  logoWrapperStyle, 
  iconContainerStyle, 
  headerTextStyle, 
  formWrapperStyle, 
  inputLabelStyle, 
  inputFieldStyle, 
  primaryButtonStyle, 
  googleButtonStyle, 
  footerTextStyle, 
  footerContainerStyle 
} from './styles';

export const Route = createFileRoute('/_auth/auth/login')({
  component: LoginPage,
});

export default function LoginPage() {
  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background Image */}
      <Box style={backgroundContainerStyle}>
        <img 
          alt="Background" 
          style={backgroundImageStyle} 
          src="https://lh3.googleusercontent.com/aida/ADBb0ujMMZMgxvutfDBaOQiYww9Jftcdnmp8aSMUj11BuE92_qY8-UsFkcgDd1b6CD3QioN0eVieCW_N-vtPai6-f2RIUP2fKlgMw5kIdYU7IlQQSoPqWoDatzF_MGjnI4nqkjzk_BE8UXPpKF2PgDOk_Yq08kD5TzY2bPsHSDlLtj6C3telwTCnD5juMN-YK7h-KQhk4QDc7guHeeXAsWTJ6Lb7K9kO5titPS8kV6IkMS1lp6T0_OJXB9uI5cJzQ5E_7BW89EWNNSJf" 
        />
        <Box style={backgroundOverlayStyle} />
      </Box>

      <main style={mainWrapperStyle}>
        {/* Login Card Container */}
        <Box style={loginCardStyle}>
          {/* Logo Section */}
          <Box style={logoWrapperStyle}>
            <Box style={iconContainerStyle}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>
                clinical_notes
              </span>
            </Box>
            <Title order={1} style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              Agenda Saúde
            </Title>
          </Box>

          {/* Header Text */}
          <Box style={headerTextStyle}>
            <Title order={2} style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              Acesso ao Portal Clínico
            </Title>
            <Text size="sm" style={{ color: 'var(--mantine-color-brand-4)' }}>
              Insira suas credenciais para acessar o prontuário digital
            </Text>
          </Box>

          {/* Login Form */}
          <form style={formWrapperStyle}>
            {/* Username/Email Field */}
            <Box>
              <Text style={inputLabelStyle}>E-mail ou CPF</Text>
              <TextInput
                placeholder="Digite seu e-mail ou CPF"
                leftSection={<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>}
                styles={{ input: inputFieldStyle }}
                variant="unstyled"
                size="md"
              />
            </Box>

            {/* Password Field */}
            <Box>
              <Text style={inputLabelStyle}>Senha</Text>
              <PasswordInput
                placeholder="Sua senha"
                leftSection={<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>}
                styles={{ input: inputFieldStyle }}
                variant="unstyled"
                size="md"
              />
            </Box>

            {/* Remember & Forgot Password */}
            <Flex align="center" justify="space-between" mt="xs">
              <Checkbox 
                label="Mantenha-me conectado" 
                size="xs" 
                styles={{ label: { fontWeight: 500, color: 'var(--mantine-color-brand-4)' } }}
              />
              <Anchor href="#" size="xs" fw={600}>
                Esqueceu sua senha?
              </Anchor>
            </Flex>

            {/* Primary Action */}
            <Button fullWidth style={primaryButtonStyle} type="submit" radius="md">
              Entrar no Sistema
            </Button>

            {/* Divider */}
            <Divider 
              label="ou continuar com" 
              labelPosition="center" 
              my="lg" 
              styles={{ label: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' } }} 
            />

            {/* Google Login Action */}
            <Button 
              fullWidth 
              variant="default" 
              style={googleButtonStyle}
              leftSection={
                <svg height="18" viewBox="0 0 18 18" width="18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"></path>
                  <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"></path>
                  <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"></path>
                  <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"></path>
                </svg>
              }
            >
              Continuar com Google
            </Button>
          </form>

          {/* Secure Message */}
          <Box style={footerTextStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified_user</span>
            <Text fw={600} style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ambiente seguro e criptografado
            </Text>
          </Box>
        </Box>
      </main>

      {/* Footer Component */}
      <footer style={footerContainerStyle}>
        <Flex direction={{ base: 'column', md: 'row' }} justify="center" align="center" gap="lg" px="xl">
          <Text size="xs">© 2024 Agenda Saúde Editorial. All rights reserved.</Text>
          <Flex gap="md">
            <Anchor href="#" size="xs" c="white" style={{ opacity: 0.7 }}>Privacy Policy</Anchor>
            <Anchor href="#" size="xs" c="white" style={{ opacity: 0.7 }}>Terms of Service</Anchor>
            <Anchor href="#" size="xs" c="white" style={{ opacity: 0.7 }}>Security Compliance</Anchor>
          </Flex>
        </Flex>
      </footer>
    </Box>
  );
}
