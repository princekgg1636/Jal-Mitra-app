import { ReactNode } from "react";
import { MobileNav } from "./MobileNav";
import { Link } from "wouter";
import { Settings as SettingsIcon, Droplet } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function Layout({ children, title, showBack }: LayoutProps) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-zinc-950 pb-20">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md h-14 flex items-center px-4">
        {showBack ? (
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 flex items-center justify-center -ml-2 mr-2 active:bg-primary/20 rounded-full"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
        ) : (
          <div className="flex items-center mr-2">
            <Droplet className="w-6 h-6 fill-white" />
          </div>
        )}
        <h1 className="text-xl font-semibold flex-1 truncate">{title || "जल सेवा"}</h1>
        {!showBack && (
          <Link href="/settings">
            <div className="w-10 h-10 flex items-center justify-center -mr-2 active:bg-primary/20 rounded-full">
              <SettingsIcon className="w-6 h-6" />
            </div>
          </Link>
        )}
      </header>
      
      <main className="flex-1 flex flex-col w-full max-w-lg mx-auto bg-slate-50 dark:bg-zinc-950">
        {children}
      </main>
      
      <MobileNav />
    </div>
  );
}
