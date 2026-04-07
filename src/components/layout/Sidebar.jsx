// Projeto SENAC 2026 - FleetSense
import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Car, FileBarChart2, MessageSquare, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/veiculos", label: "Veículos", icon: Car },
  { to: "/motoristas", label: "Motoristas", icon: Users },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
  { to: "/chat", label: "Chat IA", icon: MessageSquare },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-sidebar flex flex-col border-r border-sidebar-border shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground tracking-tight">FleetSense</h1>
          <p className="text-xs text-sidebar-foreground/50">Gestão de Frota</p>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">SENAC 2026 · v0.1.0</p>
      </div>
    </aside>
  );
}
