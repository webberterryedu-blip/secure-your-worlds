import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Languages } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeAndLangToggle() {
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-9" />
        <div className="h-9 w-9" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {/* Botão de Tradução */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleLanguage}
        title={i18n.language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
      >
        <Languages className="h-4 w-4" />
        <span className="sr-only">
          {i18n.language === 'pt' ? 'EN' : 'PT'}
        </span>
      </Button>

      {/* Botão de Tema */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title={theme === "dark" ? "Switch to light mode" : "Alternar para modo escuro"}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </div>
  );
}
