import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";

interface StudioLayoutProps {
  studioId: string;
  children: React.ReactNode;
}

export function StudioLayout({ studioId, children }: StudioLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-transparent">
        <AppSidebar studioId={studioId} />
        <div className="flex flex-col flex-1 w-full overflow-hidden min-w-0">
          <header className="flex h-12 shrink-0 items-center gap-3 px-5 z-10" style={{
            background: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)"
          }}>
            <SidebarTrigger className="-ml-1 h-7 w-7 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-sidebar-trigger" />
            <div className="flex-1" />
            {user?.role === "platform_owner" && (
              <Link href="/admin">
                <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/10" data-testid="button-header-admin">
                  <ShieldAlert className="h-3 w-3" />
                  Admin
                </button>
              </Link>
            )}
          </header>
          <main className="flex-1 overflow-auto">
            <div className="mx-auto max-w-6xl px-5 py-8 page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
