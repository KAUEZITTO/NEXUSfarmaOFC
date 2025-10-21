
'use client';

import 'intro.js/introjs.css';
import { Steps } from 'intro.js-react';
import React, { useEffect, useState, useContext, createContext, useRef } from 'react';
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
    {
        element: '[data-tour-id="step-dashboard"]',
        intro: 'Esta é a sua <strong>Visão Geral</strong>. Aqui você encontra atalhos, resumos de estoque, alertas importantes e gráficos sobre as operações.',
    },
    {
        element: '[data-tour-id="step-orders"]',
        intro: 'Agora, vamos para a seção de <strong>Pedidos</strong>. Por favor, clique no ícone de Pedidos na barra lateral e, em seguida, clique em "Próximo".',
    },
    {
        element: '[data-tour-id="step-orders"]',
        intro: 'Na área de <strong>Pedidos</strong>, você pode criar novas remessas de itens para as unidades de saúde e consultar o histórico de envios de cada uma.',
        position: 'right',
    },
    {
        element: '[data-tour-id="step-inventory"]',
        intro: 'Ótimo! Agora, clique em <strong>Inventário</strong> na barra lateral para continuar o tour.',
    },
    {
        element: '[data-tour-id="step-inventory"]',
        intro: 'Gerencie todo o seu <strong>Inventário</strong> aqui. Adicione novos produtos, edite itens existentes e tenha uma visão completa do que está em estoque.',
        position: 'right',
    },
    {
        element: '[data-tour-id="step-patients"]',
        intro: 'Vamos para <strong>Pacientes</strong>. Clique no item de menu e depois em "Próximo".',
    },
    {
        element: '[data-tour-id="step-patients"]',
        intro: 'A seção de <strong>Pacientes</strong> permite cadastrar novos pacientes, gerenciar seus dados e, o mais importante, registrar a dispensação de medicamentos e insumos.',
         position: 'right',
    },
     {
        element: '[data-tour-id="step-units"]',
        intro: 'Clique em <strong>Unidades</strong> para ver como gerenciá-las.',
    },
    {
        element: '[data-tour-id="step-units"]',
        intro: 'Cadastre e gerencie as <strong>Unidades</strong> de saúde (UBS, Hospitais, etc.) que são abastecidas pelo CAF. Você pode ver detalhes e histórico de cada uma.',
         position: 'right',
    },
    {
        element: '[data-tour-id="step-reports"]',
        intro: 'A seguir, os <strong>Relatórios</strong>. Clique no menu para continuar.',
    },
    {
        element: '[data-tour-id="step-reports"]',
        intro: 'A área de <strong>Relatórios</strong> é poderosa. Gere documentos PDF para auditoria e análise, como consumo mensal, estoque atual, validades e muito mais.',
        position: 'right',
    },
    {
        element: '[data-tour-id="step-settings"]',
        intro: 'Clique em <strong>Configurações</strong> para ver as opções de personalização.',
    },
    {
        element: '[data-tour-id="step-settings"]',
        intro: 'Em <strong>Configurações</strong>, você pode personalizar sua conta, alterar sua senha, e mudar a aparência do sistema entre os modos claro e escuro.',
         position: 'right',
    },
    {
        element: '[data-tour-id="step-about"]',
        intro: 'Quase lá! Clique em <strong>Sobre</strong>.',
    },
    {
        element: '[data-tour-id="step-about"]',
        intro: 'Na seção <strong>Sobre</strong>, você encontra informações de contato para suporte técnico, sugestões e detalhes sobre a versão do sistema.',
         position: 'right',
    },
    {
        element: '[data-tour-id="step-dashboard"]',
        intro: 'Para finalizar, clique no ícone do <strong>Dashboard</strong> para voltar à tela inicial.',
    },
    {
        element: '[data-tour-id="step-user-nav"]',
        intro: 'Por fim, aqui você pode acessar as <strong>Configurações</strong> da sua conta, refazer este tour, ou sair do sistema com segurança. Explore o NexusFarma!',
        position: 'left',
    }
].filter(Boolean); // Filter out any undefined steps

interface TourGuideWrapperProps {
  children: React.ReactNode;
}

interface UpdateDialogProps {
  currentVersion: string;
  changelog: any[];
}

// Separate component for the update dialog
const UpdateDialogContent: React.FC<UpdateDialogProps & {onClose: () => void}> = ({ currentVersion, changelog, onClose }) => {
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
                            {log.changes.map((change: string, index: number) => (
                                <li key={index}>{change}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <AlertDialogFooter>
                <AlertDialogAction onClick={onClose}>Entendido</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    );
}


export const UpdateDialog: React.FC<UpdateDialogProps> = ({ currentVersion, changelog }) => {
    const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
    const UPDATE_STORAGE_KEY = `nexusfarma-last-seen-version-${currentVersion}`;
    const tourContext = useContext(TourContext);

    useEffect(() => {
        const lastSeenVersion = localStorage.getItem(UPDATE_STORAGE_KEY);
        if (lastSeenVersion !== currentVersion) {
            setIsUpdateDialogOpen(true);
        } else {
             // If version has been seen, maybe start the tour
            (tourContext as any)?.onUpdateDialogClose();
        }
    }, [currentVersion, UPDATE_STORAGE_KEY, tourContext]);

    const handleCloseUpdateDialog = () => {
        localStorage.setItem(UPDATE_STORAGE_KEY, currentVersion);
        setIsUpdateDialogOpen(false);
        // Signal that the dialog is closed, so the tour can start
        (tourContext as any)?.onUpdateDialogClose();
    }
    
    const [AlertDialog, setAlertDialog] = useState<any>(null);
    useEffect(() => {
        import('../ui/alert-dialog').then(mod => {
            setAlertDialog(() => mod.AlertDialog);
        });
    }, []);

    if (!AlertDialog) return null;

    return (
        <AlertDialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <UpdateDialogContent currentVersion={currentVersion} changelog={changelog} onClose={handleCloseUpdateDialog} />
        </AlertDialog>
    );
}

export const TourGuideWrapper: React.FC<TourGuideWrapperProps> = ({ children }) => {
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

    useEffect(() => {
        const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!tourCompleted) {
            setCanStartTour(true);
        }
    }, []);

    const onUpdateDialogClose = () => {
        if (canStartTour) {
            const timer = setTimeout(() => {
                startTour();
            }, 500);
            return () => clearTimeout(timer);
        }
    };
    
    const contextValue = React.useMemo(() => ({
        startTour: () => {
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

    const onExit = () => {
        setIsTourActive(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
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
