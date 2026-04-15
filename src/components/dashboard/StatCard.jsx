// Projeto SENAC 2026 - FleetSense
import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <Card className="relative overflow-hidden border-0 p-4 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-5 lg:p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
          {subtitle && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("rounded-xl p-2.5 sm:p-3", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
}
