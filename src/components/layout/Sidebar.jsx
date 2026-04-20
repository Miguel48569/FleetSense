// Projeto SENAC 2026 - FleetSense
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Car,
  FileBarChart2,
  Wrench,
  MessageSquare,
  Truck,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/motoristas", label: "Motoristas", icon: Users },
  { to: "/manutencao", label: "Manutenção", icon: Wrench },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { to: "/chat", label: "Chat IA", icon: MessageSquare },
];

export default function Sidebar({
  collapsed = false,
  onToggle,
  showToggle = true,
  onNavigate,
  className,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const isCollapsed = showToggle ? collapsed : false;
  let widthClass = "w-full";
  if (showToggle) {
    widthClass = isCollapsed ? "w-20" : "w-64";
  }

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={cn(
        "relative overflow-hidden bg-sidebar flex flex-col border-r border-sidebar-border shadow-md transition-all duration-300",
        widthClass,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sidebar-primary/20 to-transparent" />

      {/* Logo */}
      <div
        className={cn(
          "relative flex items-center py-5 border-b border-sidebar-border/80",
          isCollapsed ? "justify-center px-3" : "justify-between px-6"
        )}
      >
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary/95 shadow-lg shadow-sidebar-primary/20 flex items-center justify-center ring-1 ring-white/10">
            <Truck className="w-4 h-4 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">FleetSense</h1>
              <p className="text-xs text-sidebar-foreground/60">Gestão de Frota</p>
            </div>
          )}
        </div>
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md border border-sidebar-border/70 bg-sidebar-accent/40 p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            aria-label={isCollapsed ? "Expandir sidebar" : "Minimizar sidebar"}
            title={isCollapsed ? "Expandir" : "Minimizar"}
          >
            {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
              )
            }
            title={isCollapsed ? label : undefined}
            onClick={() => onNavigate?.()}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && label}
          </NavLink>
        ))}
      </nav>

      <div className={cn("border-t border-sidebar-border/80 p-3", isCollapsed ? "px-3" : "px-4") }>
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            "text-sidebar-foreground/80 hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground",
            isCollapsed ? "flex items-center justify-center" : "flex items-center gap-3"
          )}
          title={isCollapsed ? "Sair da conta" : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && "Sair da conta"}
        </button>

        {!isCollapsed && (
          <p className="px-2 pt-3 text-xs text-sidebar-foreground/45">FleetSense 2026 · v0.1.0</p>
        )}
      </div>
    </aside>
  );
}

Sidebar.propTypes = {
  collapsed: () => null,
  onToggle: () => null,
  showToggle: () => null,
  onNavigate: () => null,
  className: () => null,
};
