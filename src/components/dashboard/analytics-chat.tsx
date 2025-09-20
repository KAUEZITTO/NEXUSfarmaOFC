
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { analyzeData } from '@/ai/flows/analytics-flow';
import ReactMarkdown from 'react-markdown';


interface Message {
  role: 'user' | 'bot';
  content: string;
}

export function AnalyticsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    setTimeout(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
        }
    }, 100);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const botResponse = await analyzeData(input);
      const botMessage: Message = { role: 'bot', content: botResponse };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error analyzing data:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na Análise',
        description: 'Não foi possível se conectar com o assistente de IA. Tente novamente mais tarde.',
      });
       setMessages((prev) => prev.slice(0, -1)); // Remove the user message on error
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
            <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {messages.length === 0 ? (
                         <div className="text-center text-sm text-muted-foreground py-8">
                            Comece fazendo uma pergunta. Ex: "Quais itens estão com estoque baixo?"
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                {message.role === 'bot' && (
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <Bot className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div className={`rounded-lg p-3 max-w-[85%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    <div className="prose prose-sm text-foreground">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                </div>
                                {message.role === 'user' && (
                                    <div className="bg-muted p-2 rounded-full">
                                        <User className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="rounded-lg p-3 bg-muted flex items-center">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
                <Button type="submit" disabled={isLoading || !input}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar'}
                </Button>
            </form>
        </div>
    </div>
  );
}
