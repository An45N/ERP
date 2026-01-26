import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "MUR"): string {
  return new Intl.NumberFormat("en-MU", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-MU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat("en-MU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-MU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
