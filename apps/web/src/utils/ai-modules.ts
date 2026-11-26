import type {ModuleType} from '@agenda-app/client';
import {Bot, FileSearch, FileText, MessageSquare} from 'lucide-react';

export const MODULE_LABELS: Record<ModuleType, string> = {
    AI_CHAT: 'Chat clínico com IA',
    AI_AGENT: 'Agente autônomo',
    AI_FORMS: 'Fichas com IA',
    AI_DOCUMENT_IMPORT: 'Importação de documentos com IA',
};

export const MODULE_ICONS = {
    AI_CHAT: MessageSquare,
    AI_AGENT: Bot,
    AI_FORMS: FileText,
    AI_DOCUMENT_IMPORT: FileSearch,
} satisfies Record<ModuleType, typeof MessageSquare>;
