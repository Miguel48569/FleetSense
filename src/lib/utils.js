import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Função utilitária para combinar classes do Tailwind
 * usando clsx e twMerge.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Verifica se a aplicação está rodando dentro de um iframe.
 */
export const isIframe = window.self !== window.top;
