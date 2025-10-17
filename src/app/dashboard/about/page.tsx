

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
    { version: '3.4.0', changes: ['Corrigido problema de cache que impedia a atualização de dados em tempo real (Not Found em recibos), garantindo que todas as informações sejam sempre as mais recentes.', 'Restaurado o layout visual das guias de remessa (impressão) para o formato original e mais compacto.'] },
    { version: '3.3.8', changes: ['Corrigido link quebrado que impedia a impressão de guias de dispensação e restaurada a exibição dos logos nos relatórios em PDF.'] },
    { version: '3.3.7', changes: ['Corrigida a exibição do avatar na tela de gerenciamento de usuários para usar o novo sistema de iniciais e cores.', 'Restaurados os logos da Prefeitura e do CAF nos cabeçalhos de todos os relatórios em PDF.'] },
    { version: '3.3.6', changes: ['Corrigida definitivamente a falha "erro desconhecido" no cadastro de novos usuários, garantindo compatibilidade da autenticação com o ambiente do servidor.', 'Resolvido erro 404 que impedia a geração de etiquetas de produtos.'] },
    { version: '3.3.5', changes: ['Corrigido erro crítico que impedia o cadastro de novos usuários devido a uma falha na inicialização do serviço de autenticação.'] },
    { version: '3.3.4', changes: ['Saudação do dashboard agora inclui o nome do usuário.', 'Adicionada funcionalidade para excluir produtos do inventário (em massa ou selecionados).', 'Corrigida a exibição de produtos por categoria na tela de dispensação.', 'Adicionado campo "Tipo de Diabetes" (DM1/DM2) para pacientes que usam insulina.'] },
    { version: '3.3.3', changes: ['Corrigido bug crítico que impedia o nome do usuário de aparecer nos documentos gerados.'] },
    { version: '3.3.2', changes: ['Corrigido bug na exibição da data de validade em recibos de remessa.', 'Corrigida a fonte de dados do relatório de dispensação por unidade para garantir precisão.', 'Melhorada a usabilidade da tela de login, desabilitando o botão durante a autenticação.'] },
    { version: '3.3.1', changes: ['Correção de erro crítico que impedia a impressão de recibos de remessa e a geração de relatórios.', 'Adicionado nome do usuário que gerou o documento nos rodapés dos recibos para rastreabilidade.', 'Melhorado o fluxo de atendimento ao paciente, exibindo a lista completa de pacientes e adicionando um botão de "Atender" na tabela principal.', 'Adicionado indicador de status (online/offline) e avatar na tela de gerenciamento de usuários.'] },
    { version: '3.3.0', changes: ['Modernização completa da interface com nova paleta de cores (azul, laranja) e identidade visual.', 'Ajustes de layout e modernização da página inicial e rodapé.'] },
    { version: '3.2.2', changes: ['Correção arquitetural definitiva para o carregamento de dados em páginas dinâmicas, resolvendo bugs de unidades e pacientes não encontrados.', 'Implementada a funcionalidade de exclusão de pedidos (com estorno de estoque) e de unidades.', 'Melhorado o cadastro de pacientes com controle de laudo de insulina, cálculo de dispensação e novas demandas.'] },
    { version: '3.2.1', changes: ['Corrigido o problema de cache de dados que impedia a exibição de informações recém-cadastradas, garantindo que os dados sejam sempre atualizados em tempo real.'] },
    { version: '3.2.0', changes: ['Refatorada a arquitetura de busca de dados em todas as páginas de listagem para resolver definitivamente o problema de "dados fantasmas", garantindo que as informações sejam atualizadas em tempo real após qualquer cadastro ou edição.'] },
    { version: '3.1.3', changes: ['Resolvido problema de atualização de dados em tempo real. As listas agora recarregam automaticamente após um novo cadastro ou edição.'] },
    { version: '3.1.2', changes: ['Correção de erro de sintaxe na diretiva `use server` que impedia o build da aplicação.'] },
    { version: '3.1.1', changes: ['Correção definitiva do erro de build `Failed to collect page data` ao isolar a lógica de importação do `knowledge-base.json` para o arquivo `data.ts`, garantindo a estabilidade da compilação.'] },
    { version: '3.1.0', changes: ['Refatoração completa do fluxo de autenticação para resolver o erro "Credenciais Inválidas" e estabilizar o login.', 'Adicionado botão de visibilidade de senha na tela de login.'] },
    { version: '3.0.9', changes: ['Corrigido fluxo de autenticação do servidor Firebase para resolver falhas de login.'] },
    { version: '3.0.8', changes: ['Resolvido problema de carregamento infinito no login através da refatoração da arquitetura de autenticação.'] },
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
                  NexusFarma v3.4.0
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
                                   Versão <Badge>{log.version.replace(/_/g, '.')}</Badge>
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
    
