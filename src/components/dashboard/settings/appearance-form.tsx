
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function AppearanceForm() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <div className="space-y-4">
        <div className="text-sm font-medium">Tema</div>
        <div className="flex items-center gap-4">
            <Button 
                variant={theme === 'light' ? 'default' : 'outline'} 
                onClick={() => toggleTheme('light')}
                className="flex-1"
            >
                <Sun className="mr-2 h-4 w-4" />
                Claro
            </Button>
            <Button 
                variant={theme === 'dark' ? 'default' : 'outline'} 
                onClick={() => toggleTheme('dark')}
                className="flex-1"
            >
                <Moon className="mr-2 h-4 w-4" />
                Escuro
            </Button>
        </div>
    </div>
  );
}
