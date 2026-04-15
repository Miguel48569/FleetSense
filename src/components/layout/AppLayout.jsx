// Projeto SENAC 2026 - FleetSense
import React, { useState } from "react";
import { Menu, Truck, LayoutDashboard, Car, Users, FileBarChart2, MessageSquare } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/motoristas", label: "Motoristas", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { to: "/chat", label: "Chat", icon: MessageSquare },
];

export default function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {!isMobile && (
        <Sidebar
          collapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {isMobile && (
          <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75">
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Abrir menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86vw] max-w-xs p-0">
                <Sidebar showToggle={false} onNavigate={() => setIsMobileSidebarOpen(false)} className="w-full" />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                <Truck className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight">FleetSense</span>
            </div>
          </header>
        )}

        <main className="flex-1 overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-4 lg:p-6 lg:pb-6">
          <Outlet />
        </main>

        {isMobile && (
          <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-1 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
              {mobileNavItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-medium transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="leading-none">{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
