
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Info, LifeBuoy, Lightbulb, Coffee, GitBranch, Heart, Users, History } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const changelog = [
    { version: '3.7.0', changes: ['Implementado o módulo completo da Farmácia Hospitalar, incluindo gerenciamento de setores, inventário próprio, pacientes internados e um novo fluxo de pedidos/solicitações entre Hospital e CAF.', 'Adicionada ferramenta de geração de etiquetas personalizadas e melhorias significativas de performance e responsividade em toda a aplicação.'] },
    { version: '3.6.2', changes: ['Refatoração completa da arquitetura de Server Actions e módulos de dados para resolver múltiplos erros de build (`Module not found` e `use server` em Client Components), garantindo a estabilidade definitiva da aplicação.'] },
    { version: '3.6.1', changes: ['Corrigido bug crítico nos recibos onde a data de validade de alguns itens não era exibida corretamente.'] },
    { version: '3.6.0', changes: ['Implementado campo de observações na tela de dispensação e no recibo final para registrar informações adicionais.', 'Corrigidos múltiplos bugs críticos de cache que causavam inconsistências de dados, garantindo que o dashboard e as listas de pacientes/unidades estejam sempre sincronizados em tempo real.', 'Resolvidos problemas de configuração do servidor que impediam o cadastro de novos usuários e a exclusão de pacientes.', 'Aprimorado o tour guiado para ser interativo e navegar entre as páginas.', 'Ajustado o design e as informações do recibo de dispensação (Termo de Entrega) para incluir dados do paciente e gerar duas vias.'] },
    { version: '3.5.1', changes: ['Correção crítica na inicialização do Firebase Admin para resolver falhas no cadastro de novos usuários.', 'Garantida a sincronização de dados em tempo real em todo o sistema, corrigindo inconsistências no dashboard e status de usuários.', 'Otimizada a consulta de dados na página de detalhes da unidade para melhor performance.'] },
    { version: '3.5.0', changes: ['Dashboard agora exibe lembretes de retorno para pacientes próximos.', 'Adicionada seção "Atividades Recentes" ao dashboard com as últimas dispensações e remessas.', 'Campo "Nome de Exibição" adicionado ao formulário de cadastro de novos usuários.', 'Implementado banner de consentimento de cookies para conformidade e transparência.'] },
    { version: '3.4.0', changes: ['Desabilitado o cache de dados no servidor (`unstable_noStore`) para resolver erros de dados desatualizados e garantir a consistência em tempo real.'] },
    { version: '3.0.7', changes: ['Implementada correção arquitetural definitiva na página de Inventário, consolidando toda a lógica em um único componente cliente para resolver o erro de build `Failed to collect page data`.'] },
    { version: '2.9.1', changes: ['Correção arquitetural definitiva para o erro de build `Failed to collect page data` na página de Inventário, utilizando `router.refresh()` para revalidação de dados.'] },
    { version: '2.9.0', changes: ['Refatoração da página de Inventário para isolar componentes Server/Client, corrigindo erro de build.'] },
    { version: '2.4.2', changes: ['Removido callback `jwt` desnecessário que causava o erro `REQUEST_HEADER_TOO_LARGE` mesmo com a estratégia de sessão `database`.'] },
    { version: '2.4.1', changes: ['Implementada correção definitiva do erro "REQUEST_HEADER_TOO_LARGE" utilizando a estratégia de sessão no banco de dados, o que minimiza o tamanho do cookie de autenticação e garante a estabilidade do sistema.'] },
    { version: '2.4.0', changes: ['Melhorias de responsividade para dispositivos móveis.', 'Tentativas iniciais de correção do erro "REQUEST_HEADER_TOO_LARGE".'] },
    { version: '2.3.0', changes: ['Melhorias significativas na responsividade para dispositivos móveis.', 'Aprimoramento da busca de conhecimento para preenchimento automático de produtos.', 'Correções de bugs gerais de estabilidade e gerenciamento de sessão.'] },
    { version: '2.2.0', changes: ['Refatorada a arquitetura de acesso a dados para resolver definitivamente o erro `OAuthSignin` e estabilizar o fluxo de login com Google e Credenciais.'] },
    { version: '2.1.1', changes: ['Corrigida a integração do provedor de credenciais para usar o Firebase Auth, unificando completamente o sistema de login.', 'Resolvido erro de "Suspense Boundary" na página de login.'] },
    { version: '2.1.0', changes: ['Implementado o fluxo completo de recuperação de senha via email, utilizando a funcionalidade nativa do Firebase Auth.'] },
    { version: '2.0.2', changes: ['Otimizado o fluxo de login para garantir o redirecionamento imediato e correto para o dashboard após a autenticação, eliminando a necessidade de recarregar a página.'] },
    { version: '2.0.1', changes: ['Correção de erros críticos de importação nas Server Actions que impediam o funcionamento de cadastros.', 'Resolvido erro que impediam o registro de novos usuários.'] },
    { version: '2.0.0', changes: ['Lançamento da versão estável "Definitivo 2". Refatoração completa da arquitetura de acesso a dados e autenticação para garantir estabilidade e corrigir múltiplos erros de build.'] },
    { version: '1.3.0', changes: ['Refatoração completa do sistema de autenticação e acesso a dados para resolver definitivamente o erro de build `Failed to collect page data`, garantindo a estabilidade da aplicação.'] },
    { version: '1.2.1', changes: ['Corrigido o redirecionamento após o login.', 'Substituída a animação de carregamento por um indicador mais claro e com melhor contraste.'] },
    { version: '1.2.0', changes: ['Correção de bugs 20: Refatoração completa do sistema de autenticação e acesso a dados para resolver definitivamente o erro de build `Failed to collect page data`, garantindo a estabilidade da aplicação.'] },
    { version: '1.1.4', changes: ['Refatoração da função `getCurrentUser` para remover a diretiva de Server Action, resolvendo definitivamente o erro de build `Failed to collect page data`.'] },
    { version: '1.1.3', changes: ['Remoção definitiva do `cache` do React da função `getCurrentUser`, resolvendo o erro de build `Failed to collect page data`.'] },
    { version: '1.1.2', changes: ['Correção de bugs 16: Refatorada a função `getCurrentUser` para remover o `cache` do React, evitando que o processo de build do Next.js a analise e cause erros.'] },
    { version: '1.1.1', changes: ['Correção de bugs 15: Correção final do erro de build `Failed to collect page data` ao forçar a renderização dinâmica da rota de API do usuário.'] },
    { version: '1.1.0', changes: ['O sistema agora é considerado estável e saiu da fase Beta.', 'Atualizadas dependências internas para melhorar performance e segurança.'] },
    { version: '1.0.2', changes: ['Correção de erro que impedia a geração de etiquetas de prateleira.'] },
    { version: '1.0.1', changes: ['Correção de erro de conexão com o banco de dados no ambiente de desenvolvimento.'] },
    { version: '1.0.0', changes: ['Lançamento do sistema de Cargos e Permissões (Admin/Usuário).', 'Adicionada tela de Gerenciamento de Usuários para Admins.', 'Reinicialização completa do banco de dados para o lançamento.'] },
    { version: '0.9.5', changes: ['Adicionado pop-up de novidades da versão para manter os usuários informados sobre as atualizações.'] },
    { version: '0.9.4', changes: ['Correção de erros de build na Vercel relacionados à configuração do Next.js.'] },
    { version: '0.9.3', changes: ['Ajustes no rodapé da página inicial.'] },
    { version: '0.9.2', changes: ['Migração completa do sistema de arquivos para o banco de dados Vercel KV, permitindo persistência de dados online.', 'Remoção de arquivos de dados JSON locais.'] },
];

const CURRENT_VERSION = '3.7.0';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-3xl font-bold">Sobre o NexusFarma</h1>
        <p className="text-muted-foreground mt-2">Informações sobre o sistema, parcerias e suporte.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-6 w-6" />
              O Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Gestão para o CAF
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Este sistema foi desenvolvido para a gestão integrada do Centro de 
                  Abastecimento Farmacêutico (CAF), otimizando o controle de estoque,
                  pedidos e distribuição para as unidades de saúde do município.
                </p>
              </div>
               <div>
                <h3 className="font-semibold flex items-center gap-2">
                    <GitBranch className="h-5 w-5 text-primary" />
                    Versão do Sistema
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  NexusFarma v{CURRENT_VERSION}
                </p>
              </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Desenvolvimento e Parcerias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Desenvolvido por
              </h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Kauê Moreira
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Apoio</h3>
              <div className="flex items-center gap-4 mt-2">
                  <Image src="/SMS-PREF.png" alt="Logo Prefeitura" width={60} height={60} data-ai-hint="city hall government" />
                  <Image src="/CAF.png" alt="Logo CAF" width={60} height={60} data-ai-hint="pharmacy cross" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="h-6 w-6" />
              Suporte e Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
               <div>
                <h3 className="font-semibold">
                  Suporte Técnico
                  </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Para suporte técnico ou dúvidas, entre em contato através do e-mail: <a href="mailto:nexusfarmaofc@gmail.com" className="text-primary hover:underline">nexusfarmaofc@gmail.com</a>.
                </p>
              </div>
               <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Sugestões Futuras
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Tem ideias para melhorar o NexusFarma? Envie suas sugestões para
                  o mesmo e-mail do suporte. Estamos sempre abertos a novas propostas para evoluir o sistema!
                </p>
              </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-6 w-6" />
                    Histórico de Versões
                </CardTitle>
                <CardDescription>Acompanhe a evolução e as melhorias do sistema a cada versão.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-72 w-full pr-4">
                    <div className="space-y-6">
                        {changelog.map(log => (
                            <div key={log.version}>
                                <h4 className="font-semibold text-foreground flex items-center gap-2">
                                   Versão <Badge>{log.version}</Badge>
                                </h4>
                                <ul className="list-disc pl-5 space-y-1 mt-2 text-sm text-muted-foreground">
                                    {log.changes.map((change: string, index: number) => (
                                        <li key={index}>{change}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
    

    



    

    











