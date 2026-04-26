import { createFileRoute } from "@tanstack/react-router";
import { Page } from "@/views/components/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIBlock } from "@/components/clinical/ai-block";

export const Route = createFileRoute("/_stackedLayout/")({
  component: WelcomePage,
});

export function WelcomePage() {
  return (
    <Page
      title="Scaffold pronto"
      subtitle="App preparado segundo o design-system.md. Crie suas páginas em src/views/modules/{feature}/."
    >
      <div className="grid gap-4">
        <Card className="border-(--color-border) bg-(--color-bg-card) shadow-none">
          <CardHeader>
            <CardTitle className="text-sub font-medium text-(--color-text-primary)">
              Tokens carregados
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm text-(--color-text-secondary)">
            <span className="rounded-(--radius-badge) bg-(--color-primary-surface) px-3 py-1 text-(--color-primary-text)">
              primary
            </span>
            <span className="rounded-(--radius-badge) bg-(--color-success-surface) px-3 py-1 text-(--color-success)">
              success
            </span>
            <span className="rounded-(--radius-badge) bg-(--color-warning-surface) px-3 py-1 text-(--color-warning)">
              warning
            </span>
            <span className="rounded-(--radius-badge) bg-(--color-danger-surface) px-3 py-1 text-(--color-danger)">
              danger
            </span>
            <span className="rounded-(--radius-badge) bg-(--color-info-surface) px-3 py-1 text-(--color-info)">
              info
            </span>
          </CardContent>
        </Card>

        <AIBlock label="Exemplo de bloco de IA — usado para conteúdo gerado">
          <p>
            Este bloco demonstra o estilo obrigatório para conteúdo de IA: borda esquerda teal,
            background <span className="font-mono">--color-ai-bg</span>, sem border-radius. Veja{" "}
            <span className="font-mono">design-system.md §10.1</span>.
          </p>
        </AIBlock>

        <Card className="border-(--color-border) bg-(--color-bg-card) shadow-none">
          <CardHeader>
            <CardTitle className="text-sub font-medium text-(--color-text-primary)">
              Próximos passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 text-sm-body text-(--color-text-secondary) space-y-1">
              <li>
                Criar um módulo em{" "}
                <span className="font-mono text-(--color-text-primary)">
                  src/views/modules/{"{feature}"}/
                </span>
              </li>
              <li>
                Adicionar a rota em{" "}
                <span className="font-mono text-(--color-text-primary)">
                  src/views/modules/routes.ts
                </span>
              </li>
              <li>
                Implementar a página usando shadcn (
                <span className="font-mono text-(--color-text-primary)">@/components/ui</span>) e
                tokens (
                <span className="font-mono text-(--color-text-primary)">var(--color-*)</span>)
              </li>
              <li>
                Quando precisar de IA, envolver em{" "}
                <span className="font-mono text-(--color-text-primary)">{"<AIBlock>"}</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
