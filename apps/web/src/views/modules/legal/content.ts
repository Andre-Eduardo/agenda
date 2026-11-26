import type {LegalDocumentContent} from '@/views/modules/legal/components/LegalDocument';

/*
 * RASCUNHO para revisão do encarregado de dados (DPO) e do jurídico.
 * Os trechos entre colchetes ([...]) precisam ser preenchidos antes do lançamento.
 * O texto é mantido apenas em pt-BR porque o documento vale para a legislação brasileira (LGPD).
 */

export const privacyPolicy: LegalDocumentContent = {
    title: 'Política de Privacidade',
    version: '0.1 (rascunho)',
    updatedAt: '26/11/2026',
    intro:
        'Esta Política explica como o Agenda Saúde trata dados pessoais de pacientes, profissionais e ' +
        'usuários das clínicas, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).',
    sections: [
        {
            title: '1. Quem somos e papéis no tratamento',
            paragraphs: [
                '[RAZÃO SOCIAL], inscrita no CNPJ sob o nº [CNPJ], com sede em [ENDEREÇO], fornece o software ' +
                    'Agenda Saúde às clínicas.',
                'Para os dados dos pacientes, a clínica é a controladora e o Agenda Saúde atua como operador, ' +
                    'tratando os dados conforme as instruções da clínica. Para os dados de cadastro dos usuários ' +
                    'do sistema, o Agenda Saúde é o controlador. [VALIDAR COM O DPO]',
            ],
        },
        {
            title: '2. Dados que tratamos',
            items: [
                'Dados de identificação e contato: nome, CPF, data de nascimento, telefone, e-mail e endereço.',
                'Dados de agendamento: datas, horários, profissional, sala e situação das consultas.',
                'Dados pessoais sensíveis de saúde: prontuário, evoluções, documentos clínicos, formulários e anexos.',
                'Dados de convênio e financeiros: plano, número da carteirinha, pagamentos e cobranças.',
                'Dados de comunicação: lembretes enviados, confirmações de entrega e leitura, respostas do ' +
                    'paciente e preferências de contato.',
                'Dados de uso e segurança: registros de acesso (logs), endereço IP e ações realizadas no sistema.',
            ],
        },
        {
            title: '3. Finalidades e bases legais',
            items: [
                'Prestação do serviço de saúde e manutenção do prontuário: tutela da saúde (art. 11, II, "f") e ' +
                    'cumprimento de obrigação legal ou regulatória (art. 7º, II e art. 11, II, "a").',
                'Agendamento e lembretes de consulta: execução de contrato (art. 7º, V) e legítimo interesse ' +
                    '(art. 7º, IX), respeitando o direito do paciente de recusar os lembretes a qualquer momento.',
                'Faturamento, convênios e obrigações fiscais: execução de contrato e obrigação legal.',
                'Segurança, prevenção a fraudes e auditoria: legítimo interesse e obrigação legal.',
                'Recursos de inteligência artificial, quando contratados pela clínica: [DEFINIR BASE LEGAL E ' +
                    'SALVAGUARDAS COM O DPO].',
            ],
        },
        {
            title: '4. Comunicações e opt-out',
            paragraphs: [
                'A clínica pode enviar lembretes de consulta por WhatsApp, SMS e e-mail. O paciente pode recusar ' +
                    'qualquer canal a qualquer momento: respondendo SAIR a um lembrete no WhatsApp, marcando o ' +
                    'e-mail como spam ou pedindo à clínica. A recusa é registrada com data, hora e meio utilizado, ' +
                    'e nenhum novo lembrete é enviado pelo canal recusado.',
            ],
        },
        {
            title: '5. Compartilhamento',
            paragraphs: [
                'Os dados são compartilhados apenas com fornecedores necessários à operação, como hospedagem em ' +
                    'nuvem, envio de e-mails, mensagens de WhatsApp e SMS e processamento de pagamentos, sempre sob ' +
                    'contrato e com obrigações de confidencialidade. [LISTAR FORNECEDORES E PAÍSES]',
                'Dados também podem ser compartilhados com autoridades quando houver obrigação legal ou ordem judicial.',
            ],
        },
        {
            title: '6. Transferência internacional',
            paragraphs: [
                '[INFORMAR SE HÁ ARMAZENAMENTO OU PROCESSAMENTO FORA DO BRASIL E O MECANISMO DO ART. 33 DA LGPD.]',
            ],
        },
        {
            title: '7. Retenção',
            paragraphs: [
                'O prontuário é mantido pelo prazo mínimo exigido pela regulamentação aplicável (por exemplo, 20 ' +
                    'anos, conforme a Lei nº 13.787/2018). Os demais dados são mantidos enquanto necessários às ' +
                    'finalidades acima ou para cumprimento de obrigações legais. [VALIDAR PRAZOS COM O DPO]',
            ],
        },
        {
            title: '8. Segurança',
            paragraphs: [
                'Adotamos medidas técnicas e administrativas para proteger os dados, como criptografia em trânsito, ' +
                    'controle de acesso por perfil, registro de auditoria e isolamento dos dados de cada clínica.',
            ],
        },
        {
            title: '9. Direitos do titular',
            paragraphs: [
                'O titular pode solicitar confirmação do tratamento, acesso, correção, anonimização, bloqueio ou ' +
                    'eliminação de dados desnecessários, portabilidade, informação sobre compartilhamentos e ' +
                    'revogação do consentimento, nos termos do art. 18 da LGPD. Pacientes devem, preferencialmente, ' +
                    'fazer o pedido à clínica onde são atendidos.',
            ],
        },
        {
            title: '10. Encarregado (DPO)',
            paragraphs: ['Encarregado: [NOME DO ENCARREGADO]. Contato: [E-MAIL DO ENCARREGADO].'],
        },
        {
            title: '11. Alterações desta Política',
            paragraphs: [
                'Esta Política pode ser atualizada. A versão e a data da última alteração aparecem no topo da página.',
            ],
        },
    ],
};

export const termsOfUse: LegalDocumentContent = {
    title: 'Termos de Uso',
    version: '0.1 (rascunho)',
    updatedAt: '26/11/2026',
    intro:
        'Estes Termos regulam o uso do Agenda Saúde pelas clínicas e por seus usuários. Ao acessar o sistema, ' +
        'o usuário declara que leu e concorda com estes Termos e com a Política de Privacidade.',
    sections: [
        {
            title: '1. O serviço',
            paragraphs: [
                'O Agenda Saúde é um software de gestão de clínicas que oferece agenda, cadastro de pacientes, ' +
                    'prontuário eletrônico, lembretes, faturamento e recursos opcionais de inteligência artificial.',
            ],
        },
        {
            title: '2. Cadastro e acesso',
            items: [
                'Cada usuário deve ter login próprio e é responsável por manter sua senha em sigilo.',
                'A clínica define os perfis e permissões de acesso de seus membros.',
                'O acesso pode ser suspenso em caso de uso indevido ou violação destes Termos.',
            ],
        },
        {
            title: '3. Responsabilidades da clínica',
            items: [
                'Ter base legal para tratar os dados dos pacientes que cadastra e informar os pacientes sobre o tratamento.',
                'Registrar no sistema os pedidos de opt-out dos pacientes que chegarem por outros meios.',
                'Garantir que o uso do prontuário siga as normas do respectivo conselho profissional.',
                'Revisar os conteúdos gerados por inteligência artificial antes de usá-los no atendimento.',
            ],
        },
        {
            title: '4. Uso aceitável',
            paragraphs: [
                'É proibido usar o sistema para enviar mensagens não relacionadas ao atendimento, tentar acessar ' +
                    'dados de outras clínicas, contornar controles de segurança ou violar a legislação vigente.',
            ],
        },
        {
            title: '5. Disponibilidade e suporte',
            paragraphs: ['[DEFINIR NÍVEL DE SERVIÇO, JANELAS DE MANUTENÇÃO E CANAIS DE SUPORTE.]'],
        },
        {
            title: '6. Planos, pagamento e cancelamento',
            paragraphs: ['[DEFINIR CONDIÇÕES COMERCIAIS, REAJUSTE, INADIMPLÊNCIA E CANCELAMENTO.]'],
        },
        {
            title: '7. Dados ao fim do contrato',
            paragraphs: [
                'Ao fim do contrato, a clínica poderá exportar seus dados por [PRAZO]. Depois disso, os dados serão ' +
                    'eliminados, exceto os que precisem ser mantidos por obrigação legal. [VALIDAR COM O DPO]',
            ],
        },
        {
            title: '8. Limitação de responsabilidade',
            paragraphs: [
                'O Agenda Saúde não substitui o julgamento clínico do profissional. [DEFINIR LIMITES DE ' +
                    'RESPONSABILIDADE COM O JURÍDICO.]',
            ],
        },
        {
            title: '9. Foro e legislação',
            paragraphs: [
                'Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro de [CIDADE/UF] para dirimir ' +
                    'eventuais controvérsias.',
            ],
        },
        {
            title: '10. Contato',
            paragraphs: ['[E-MAIL E TELEFONE DE CONTATO].'],
        },
    ],
};
