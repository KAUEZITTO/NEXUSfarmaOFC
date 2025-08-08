
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyzeData } from '@/ai/flows/analytics-flow';
import { ScrollArea } from '../ui/scroll-area';
import Markdown from 'react-markdown';


interface Message {
  role: 'user' | 'bot';
  content: string;
}

export function AnalyticsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const botResponse = await analyzeData(input);
      const botMessage: Message = { role: 'bot', content: botResponse };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error analyzing data:', error);
      const errorMessage: Message = {
        role: 'bot',
        content: 'Desculpe, ocorreu um erro ao analisar os dados. Tente novamente.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[500px]">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Análise com IA
            </CardTitle>
            <CardDescription>
                Faça perguntas em linguagem natural sobre os dados do sistema.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-grow pr-4 -mr-4">
                <div className="space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                        Comece fazendo uma pergunta. Ex: "Quais itens estão com estoque baixo?"
                    </div>
                )}
                {messages.map((message, index) => (
                    <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'bot' && <div className="bg-primary/10 p-2 rounded-full"><Bot className="h-5 w-5 text-primary" /></div>}
                    <div className={`rounded-lg px-4 py-2 max-w-sm ${
                        message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                        <div className="prose prose-sm max-w-none">
                            <Markdown>{message.content}</Markdown>
                        </div>
                    </div>
                    {message.role === 'user' && <div className="bg-muted p-2 rounded-full"><User className="h-5 w-5 text-muted-foreground" /></div>}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full"><Bot className="h-5 w-5 text-primary" /></div>
                        <div className="bg-muted rounded-lg px-4 py-2 flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Analisando...</span>
                        </div>
                    </div>
                )}
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
