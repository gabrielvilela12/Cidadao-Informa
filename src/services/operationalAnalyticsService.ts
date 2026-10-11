import { apiRequest } from './http';

export interface OperationalAnalytics {
  startDate: string;
  endDate: string;
  timezone: string;
  generatedAt: string;
  summary: {
    total: number;
    completed: number;
    completionRate: number;
    averageResolutionDays: number | null;
    timedCompletions: number;
    totalCost: number | null;
    averageCost: number | null;
    costedCompletions: number;
  };
  distribution: { category: string; status: string; total: number }[];
  monthly: { month: string; opened: number; completed: number }[];
  recurrence: { position: number; address: string; category: string; reports: number }[];
}

export function getOperationalAnalytics(startDate: string, endDate: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ startDate, endDate });
  return apiRequest<OperationalAnalytics>(`/api/admin/analytics?${params}`, { signal });
}
