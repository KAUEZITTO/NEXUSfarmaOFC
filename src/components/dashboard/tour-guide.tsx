
'use client';

import 'intro.js/introjs.css';
import { Steps } from 'intro.js-react';
import React, { useEffect, useState, useContext, createContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { navItems } from './dashboard-nav';

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
];

export function TourProvider({ children }: { children: React.ReactNode }) {
    const [isTourActive, setIsTourActive] = useState(false);

    const startTour = () => {
        setIsTourActive(true);
    };

    return (
        <TourContext.Provider value={{ startTour }}>
            {children}
            <TourGuide isTourActive={isTourActive} setIsTourActive={setIsTourActive} />
        </TourContext.Provider>
    );
};


export function TourGuide({ isTourActive, setIsTourActive }: { isTourActive: boolean, setIsTourActive: (isActive: boolean) => void }) {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
        if (!tourCompleted) {
            const timer = setTimeout(() => setIsTourActive(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [setIsTourActive]);

    const onExit = () => {
        setIsTourActive(false);
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    };

    const onBeforeChange = (nextStepIndex: number) => {
        const step = tourSteps[nextStepIndex];
        if (!step) return;

        const tourId = step.element.replace(/\[data-tour-id="|"\]/g, '');
        const navItem = navItems.find(item => item.tourId === tourId);

        if (navItem && navItem.href !== pathname) {
            router.push(navItem.href);
        }
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
                skipLabel: 'Pular Tour',
                tooltipClass: 'custom-tooltip-class',
                highlightClass: 'custom-highlight-class',
                exitOnOverlayClick: false,
            }}
        />
    );
}
