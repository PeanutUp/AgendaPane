import type { RecurrenceRule } from "./types";

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return false;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return formatDateKey(date) === value;
}

export function parseDateKey(value: string): Date {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) return new Date();
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getCalendarDates(month: Date, mondayFirst: boolean): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const weekday = first.getDay();
  const daysBefore = mondayFirst ? (weekday + 6) % 7 : weekday;
  const start = addDays(first, -daysBefore);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const visibleDays = Math.ceil((daysBefore + daysInMonth) / 7) * 7;
  return Array.from({ length: visibleDays }, (_, index) => addDays(start, index));
}

export function sameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function addMonthsClamped(date: Date, amount: number, preferredDay = date.getDate()): Date {
  const targetMonth = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  return new Date(targetMonth.getFullYear(), targetMonth.getMonth(), Math.min(preferredDay, lastDay));
}

function addYearsClamped(
  date: Date,
  amount: number,
  preferredMonth = date.getMonth(),
  preferredDay = date.getDate(),
): Date {
  const targetYear = date.getFullYear() + amount;
  const lastDay = new Date(targetYear, preferredMonth + 1, 0).getDate();
  return new Date(targetYear, preferredMonth, Math.min(preferredDay, lastDay));
}

export function getNextOccurrence(dateKey: string, rule: RecurrenceRule): string | null {
  if (!isDateKey(dateKey) || rule.frequency === "none") return null;
  const date = parseDateKey(dateKey);
  const anchor = rule.anchorDate && isDateKey(rule.anchorDate) ? parseDateKey(rule.anchorDate) : date;
  let next: Date;

  switch (rule.frequency) {
    case "daily":
      next = addDays(date, 1);
      break;
    case "weekdays":
      next = addDays(date, 1);
      while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, 1);
      break;
    case "weekly":
      next = addDays(date, 7);
      break;
    case "monthly":
      next = addMonthsClamped(date, 1, anchor.getDate());
      break;
    case "yearly":
      next = addYearsClamped(date, 1, anchor.getMonth(), anchor.getDate());
      break;
    case "custom": {
      const interval = Math.max(1, Math.min(999, Math.trunc(rule.interval) || 1));
      if (rule.unit === "day") next = addDays(date, interval);
      else if (rule.unit === "week") next = addDays(date, interval * 7);
      else if (rule.unit === "month") next = addMonthsClamped(date, interval, anchor.getDate());
      else next = addYearsClamped(date, interval, anchor.getMonth(), anchor.getDate());
      break;
    }
  }

  return formatDateKey(next);
}
