'use client';

import 'intro.js/introjs.css';
import { Steps } from 'intro.js-react';
import React, { useEffect, useState, useContext, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { navItems } from './dashboard-nav';
import { useSidebar } from '../ui/sidebar';

const TOUR_STORAGE_KEY = 'nexusfarma-tour-completed-v1';

type TourContextType = {
    startTour: () => void;
};

const TourContext = createContext<TourContextType | null>(null);

export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};

const tourSteps = [
    {
        element: '[data-tour-id="step-logo"]',
        intro: 'Bem-vindo ao <strong>NexusFarma</strong>! Este é seu painel de controle central. Clique aqui a qualquer momento para voltar à tela inicial do dashboard.',
    },
    ...navItems.map(item => {
        let intro = '';
        switch(item.label) {
            case 'Dashboard':
                intro = 'Esta é a sua <strong>Visão Geral</strong>. Aqui você encontra atalhos, resumos de estoque, alertas importantes e gráficos sobre as operações.';
                break;
            case 'Pedidos':
                intro = 'Na área de <strong>Pedidos</strong>, você pode criar novas remessas de itens para as unidades de saúde e consultar o histórico de envios de cada uma.';
                break;
            case 'Inventário':
                intro = 'Gerencie todo o seu <strong>Inventário</strong> aqui. Adicione novos produtos, edite itens existentes e tenha uma visão completa do que está em estoque.';
                break;
            case 'Pacientes':
                intro = 'A seção de <strong>Pacientes</strong> permite cadastrar novos pacientes, gerenciar seus dados, e o mais importante: registrar a dispensação de medicamentos e insumos.';
                break;
            case 'Unidades':
                intro = 'Cadastre e gerencie as <strong>Unidades</strong> de saúde (UBS, Hospitais, etc.) que são abastecidas pelo CAF. Você pode ver detalhes e histórico de cada uma.';
                break;
            case 'Relatórios':
                intro = 'A área de <strong>Relatórios</strong> é poderosa. Gere documentos PDF para auditoria e análise, como consumo mensal, estoque atual, validades e muito mais.';
                break;
             case 'Usuários':
                intro = 'Como <strong>Administrador</strong>, você pode gerenciar os usuários do sistema, alterando seus níveis de acesso e cargos.';
                break;
            case 'Configurações':
                intro = 'Em <strong>Configurações</strong>, você pode personalizar sua conta, alterar sua senha, e mudar a aparência do sistema entre os modos claro e escuro.';
                break;
            case 'Sobre':
                intro = 'Na seção <strong>Sobre</strong>, você encontra informações de contato para suporte técnico, sugestões e detalhes sobre a versão do sistema.';
                break;
        }
        return {
            element: `[data-tour-id="${item.tourId}"]`,
            intro: intro,
        }
    }),
     {
        element: '[data-tour-id="step-user-nav"]',
        intro: 'Por fim, aqui você pode acessar as <strong>Configurações</strong> da sua conta, refazer este tour, ou sair do sistema com segurança. Explore o NexusFarma!',
    }
].filter(Boolean); // Filter out any undefined steps (like admin route for non-admin)

export function TourGuideWrapper({ children }: { children: React.ReactNode }) {
    const [isTourActive, setIsTourActive] = useState(false);
    const [canStartTour, setCanStartTour] = useState(false);
    const { setOpen } = useSidebar();

    const startTour = () => {
        const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!tourCompleted) {
            setOpen(true); 
            setIsTourActive(true);
        }
    };

    // This effect checks if the tour should be started automatically.
    useEffect(() => {
        const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!tourCompleted) {
            // We set canStartTour to true, but don't start it yet.
            // The UpdateDialog will call startTour when it's closed.
            setCanStartTour(true);
        }
    }, []);

    // Function for UpdateDialog to call when it closes
    const onUpdateDialogClose = () => {
        if (canStartTour) {
            const timer = setTimeout(() => {
                startTour();
            }, 500); // Small delay to ensure dialog is gone
            return () => clearTimeout(timer);
        }
    };
    
    // Pass startTour and onUpdateDialogClose down through context
    const contextValue = React.useMemo(() => ({
        startTour: () => { // manual start
            setOpen(true);
            setIsTourActive(true);
        },
        onUpdateDialogClose,
    }), [onUpdateDialogClose]);


    return (
        <TourContext.Provider value={contextValue}>
            {children}
            <TourGuide isTourActive={isTourActive} setIsTourActive={setIsTourActive} />
        </TourContext.Provider>
    );
};


export function TourGuide({ isTourActive, setIsTourActive }: { isTourActive: boolean, setIsTourActive: (isActive: boolean) => void }) {
    const router = useRouter();
    const pathname = usePathname();

    const onExit = () => {
        setIsTourActive(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    };

    const onBeforeChange = (nextStepIndex: number) => {
        // Ensure we don't go out of bounds
        if (nextStepIndex < 0 || nextStepIndex >= tourSteps.length) {
            onExit();
            return false;
        }

        const step = tourSteps[nextStepIndex];
        if (!step || !step.element) {
             return false;
        }

        const targetElement = document.querySelector(step.element);
         if (!targetElement) {
            // Find the nav item associated with the step
            const tourId = step.element.replace(/\[data-tour-id="|"\]/g, '');
            const navItem = navItems.find(item => item.tourId === tourId);

            // If it's a nav item and we're not on its page, navigate
            if (navItem && navItem.href !== pathname) {
                router.push(navItem.href);
            }
            // If the element still doesn't exist, it's probably better to just skip
            // or end the tour to avoid getting stuck.
            return false;
        }

        return true;
    };


    if (!isTourActive) {
        return null;
    }

    return (
        <Steps
            enabled={isTourActive}
            steps={tourSteps}
            initialStep={0}
            onExit={onExit}
            onBeforeChange={onBeforeChange}
            options={{
                nextLabel: 'Próximo',
                prevLabel: 'Anterior',
                doneLabel: 'Finalizar',
                skipLabel: 'Pular',
                tooltipClass: 'custom-tooltip-class',
                highlightClass: 'custom-highlight-class',
                exitOnOverlayClick: false,
                showBullets: false,
            }}
        />
    );
}

// Separate component for the update dialog
export function UpdateDialog({ currentVersion, changelog }: { currentVersion: string, changelog: any[] }) {
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const UPDATE_STORAGE_KEY = `nexusfarma-last-seen-version-${currentVersion}`;
    const tourContext = useContext(TourContext);

    useEffect(() => {
        const lastSeenVersion = localStorage.getItem(UPDATE_STORAGE_KEY);
        if (lastSeenVersion !== currentVersion) {
            setIsUpdateDialogOpen(true);
        } else {
             // If version has been seen, maybe start the tour
            tourContext?.onUpdateDialogClose();
        }
    }, [currentVersion, UPDATE_STORAGE_KEY, tourContext]);

    const handleCloseUpdateDialog = () => {
        localStorage.setItem(UPDATE_STORAGE_KEY, currentVersion);
        setIsUpdateDialogOpen(false);
        // Signal that the dialog is closed, so the tour can start
        tourContext?.onUpdateDialogClose();
    }
    
    // Lazy-load the AlertDialog to avoid issues with server components
    const [AlertDialog, setAlertDialog] = useState<any>(null);
    useEffect(() => {
        import('../ui/alert-dialog').then(mod => {
            setAlertDialog(() => mod.AlertDialog);
        });
    }, []);

    if (!AlertDialog) return null;

    const {
        AlertDialogAction,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } = require('../ui/alert-dialog');
    const { Badge } = require('../ui/badge');

    return (
        <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Novidades da Versão <Badge>{currentVersion}</Badge>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Confira o que mudou na última atualização do sistema:
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="text-sm text-muted-foreground space-y-3 max-h-60 overflow-y-auto pr-4">
                    {changelog.map(log => (
                        <div key={log.version}>
                            <h4 className="font-semibold text-foreground">Versão {log.version}</h4>
                            <ul className="list-disc pl-5 space-y-1 mt-1">
                                {log.changes.map((change, index) => (
                                    <li key={index}>{change}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={handleCloseUpdateDialog}>Entendido</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
