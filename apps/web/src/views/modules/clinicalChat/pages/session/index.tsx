import { useEffect, useRef, useState } from 'react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { Box, TextInput, Button, Stack, Text, Group } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListSessions,
  useCreateSession,
  useListMessages,
  useSendChatMessage,
  getListMessagesQueryKey,
} from '@agenda-app/client';
import { Page } from '../../../../components/Page';
import { LoadingSkeleton } from '../../../../components/LoadingSkeleton';
import { EmptyState } from '../../../../components/EmptyState';

export const Route = createFileRoute('/_stackedLayout/patients/$patientId/chat')({
  component: ChatSessionPage,
});

function ChatSessionPage() {
  const { patientId } = useParams({ from: '/_stackedLayout/patients/$patientId/chat' });
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData } = useListSessions({
    patientId,
    professionalId: '',
    status: 'OPEN' as any,
    cursor: null,
    limit: 1,
    sort: null,
  } as any);

  const createSession = useCreateSession();
  const existingSession = ((sessionsData as any)?.items ?? [])[0];

  useEffect(() => {
    if (existingSession?.id) {
      setSessionId(existingSession.id);
    } else if (!sessionId && !createSession.isPending) {
      createSession.mutate(
        { data: { patientId, professionalId: '', title: 'Sessão clínica' } as any },
        {
          onSuccess: (s: any) => {
            if (s?.id) setSessionId(s.id);
          },
        },
      );
    }
  }, [existingSession, sessionId]);

  const { data: messagesData, isLoading: loadingMessages } = useListMessages((sessionId ?? '') as any, {
    query: { enabled: !!sessionId },
  } as any);
  const messages = ((messagesData as any)?.items ?? (messagesData as any) ?? []) as any[];

  const sendMutation = useSendChatMessage();
  const onSend = () => {
    if (!sessionId || !draft.trim()) return;
    const content = draft;
    setDraft('');
    sendMutation.mutate(
      { id: sessionId, data: { content } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(sessionId as any) });
        },
      },
    );
  };

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight });
  }, [messages.length]);

  return (
    <Page title="Chat Clínico IA" subtitle="Assistente para análise clínica">
      <Box
        ref={messagesRef}
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 20,
          minHeight: 400,
          maxHeight: 600,
          overflow: 'auto',
          marginBottom: 12,
        }}
      >
        {loadingMessages ? (
          <LoadingSkeleton rows={3} height={60} />
        ) : messages.length === 0 ? (
          <EmptyState icon="chat" title="Nenhuma mensagem" message="Inicie a conversa abaixo." />
        ) : (
          <Stack gap="sm">
            {messages.map((m: any) => (
              <Box
                key={m.id}
                style={{
                  alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  backgroundColor: m.role === 'USER' ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-brand-0)',
                  color: m.role === 'USER' ? 'white' : 'inherit',
                  padding: '10px 14px',
                  borderRadius: 10,
                }}
              >
                <Text size="sm">{m.content}</Text>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Group gap="sm">
        <TextInput
          placeholder="Digite sua pergunta..."
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          style={{ flex: 1 }}
          disabled={sendMutation.isPending}
        />
        <Button onClick={onSend} loading={sendMutation.isPending} disabled={!draft.trim()}>
          Enviar
        </Button>
      </Group>
    </Page>
  );
}
