import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
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
  Divider,
  Alert,
} from '@mantine/core';
import { useSignIn } from '@agenda-app/client';
import { useAppStore } from '../../../../../store/appStore';
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
  footerContainerStyle,
} from './styles';

export const Route = createFileRoute('/_auth/auth/login')({
  component: LoginPage,
});

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const signInMutation = useSignIn();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    signInMutation.mutate(
      { data: { username, password } },
      {
        onSuccess: () => {
          setAuth(true);
          navigate({ to: '/' });
        },
        onError: (err: any) => {
          setError(err?.detail ?? err?.title ?? 'Credenciais inválidas');
        },
      },
    );
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Box style={backgroundContainerStyle}>
        <img
          alt="Background"
          style={backgroundImageStyle}
          src="https://lh3.googleusercontent.com/aida/ADBb0ujMMZMgxvutfDBaOQiYww9Jftcdnmp8aSMUj11BuE92_qY8-UsFkcgDd1b6CD3QioN0eVieCW_N-vtPai6-f2RIUP2fKlgMw5kIdYU7IlQQSoPqWoDatzF_MGjnI4nqkjzk_BE8UXPpKF2PgDOk_Yq08kD5TzY2bPsHSDlLtj6C3telwTCnD5juMN-YK7h-KQhk4QDc7guHeeXAsWTJ6Lb7K9kO5titPS8kV6IkMS1lp6T0_OJXB9uI5cJzQ5E_7BW89EWNNSJf"
        />
        <Box style={backgroundOverlayStyle} />
      </Box>

      <main style={mainWrapperStyle}>
        <Box style={loginCardStyle}>
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

          <Box style={headerTextStyle}>
            <Title order={2} style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              Acesso ao Portal Clínico
            </Title>
            <Text size="sm" style={{ color: 'var(--mantine-color-brand-4)' }}>
              Insira suas credenciais para acessar o prontuário digital
            </Text>
          </Box>

          <form style={formWrapperStyle} onSubmit={handleSubmit}>
            {error && (
              <Alert color="danger" variant="light">
                {error}
              </Alert>
            )}

            <Box>
              <Text style={inputLabelStyle}>Usuário</Text>
              <TextInput
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                leftSection={<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>}
                styles={{ input: inputFieldStyle }}
                variant="unstyled"
                size="md"
                required
              />
            </Box>

            <Box>
              <Text style={inputLabelStyle}>Senha</Text>
              <PasswordInput
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                leftSection={<span className="material-symbols-outlined" style={{ fontSize: '20px' }}>lock</span>}
                styles={{ input: inputFieldStyle }}
                variant="unstyled"
                size="md"
                required
              />
            </Box>

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

            <Button
              fullWidth
              style={primaryButtonStyle}
              type="submit"
              radius="md"
              loading={signInMutation.isPending}
            >
              Entrar no Sistema
            </Button>

            <Divider
              label="ou continuar com"
              labelPosition="center"
              my="lg"
              styles={{ label: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' } }}
            />

            <Button fullWidth variant="default" style={googleButtonStyle} disabled>
              Continuar com Google
            </Button>
          </form>

          <Box style={footerTextStyle}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              verified_user
            </span>
            <Text fw={600} style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ambiente seguro e criptografado
            </Text>
          </Box>
        </Box>
      </main>

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
