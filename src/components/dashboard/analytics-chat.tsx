
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';


interface Message {
  role: 'user' | 'bot';
  content: string;
}

export function AnalyticsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isLoading) return;
    
    toast({
        title: 'Funcionalidade em Desenvolvimento',
        description: 'O assistente de IA para análise de dados ainda não foi implementado.',
    });
  };

  return (
    <div className="flex flex-col h-full max-h-[500px]">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Análise com IA
            </CardTitle>
            <CardDescription>
                Faça perguntas em linguagem natural sobre os dados do sistema. (Em desenvolvimento)
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-4">
                    <div className="text-center text-sm text-muted-foreground py-8">
                        Comece fazendo uma pergunta. Ex: "Quais itens estão com estoque baixo?"
                    </div>
                </div>
            </ScrollArea>
        </CardContent>
         <div className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ex: Liste os produtos vencendo nos próximos 90 dias"
                    className="flex-grow resize-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            handleSubmit(e);
                        }
                    }}
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                    Enviar
                </Button>
            </form>
        </div>
    </div>
  );
}
