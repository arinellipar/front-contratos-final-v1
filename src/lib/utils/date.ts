/**
 * @fileoverview Utilitários para manipulação de datas
 * @module @/lib/utils/date
 */

import { format, parseISO, isValid, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Parse date safely
 * @description Parse de data com validação
 */
export const parseDate = (
  date: string | Date | null | undefined
): Date | null => {
  if (!date) return null;

  const parsed = typeof date === "string" ? parseISO(date) : date;

  return isValid(parsed) ? parsed : null;
};

/**
 * Add business days
 * @description Adiciona dias úteis a uma data
 */
export const addBusinessDays = (date: Date, days: number): Date => {
  let currentDate = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    currentDate = addDays(currentDate, 1);
    const dayOfWeek = currentDate.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }

  return currentDate;
};

/**
 * Get date range
 * @description Gera array de datas entre início e fim
 */
export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
};

/**
 * Is weekend
 * @description Verifica se data é fim de semana
 */
export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/**
 * Get quarter
 * @description Obtém trimestre de uma data
 */
export const getQuarter = (date: Date): number => {
  return Math.floor(date.getMonth() / 3) + 1;
};

/**
 * Format date range
 * @description Formata intervalo de datas
 */
export const formatDateRange = (startDate: Date, endDate: Date): string => {
  const start = format(startDate, "dd/MM/yyyy", { locale: ptBR });
  const end = format(endDate, "dd/MM/yyyy", { locale: ptBR });

  return `${start} - ${end}`;
};

/**
 * Days between dates
 * @description Calcula dias entre datas
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  return Math.abs(differenceInDays(date1, date2));
};

/**
 * Is date in range
 * @description Verifica se data está no intervalo
 */
export const isDateInRange = (
  date: Date,
  startDate: Date,
  endDate: Date
): boolean => {
  return date >= startDate && date <= endDate;
};

/**
 * Get month name
 * @description Obtém nome do mês em português
 */
export const getMonthName = (date: Date): string => {
  return format(date, "MMMM", { locale: ptBR });
};

/**
 * Get week number
 * @description Obtém número da semana no ano
 */
export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;

  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};
