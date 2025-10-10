
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
    const router = useRouter();
    const pathname = usePathname();

    const onExit = () => {
        setIsTourActive(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    };

    const onBeforeChange = (nextStepIndex: number) => {
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
            const tourId = step.element.replace(/\[data-tour-id="|"\]/g, '');
            const navItem = navItems.find(item => item.tourId === tourId);

            if (navItem && navItem.href !== pathname) {
                router.push(navItem.href);
            }
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


