import { apiRequest } from './http';

export interface AiBillingDashboard {
  wallet: {
    balanceBrl: number;
    totalCreditedBrl: number;
    totalConsumedBrl: number;
    updatedAt: string;
  };
  subscription: {
    id: string;
    planName: string;
    status: string;
    monthlyAmountBrl: number;
    billingDay: number;
    currentPeriodEnd?: string | null;
  };
  currentMonth: {
    requests: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cachedTokens: number;
    openRouterCostUsd: number;
    upstreamInferenceCostUsd: number;
    chargedAmountBrl: number;
  };
  balanceHealth: {
    level: 'healthy' | 'low' | 'critical' | 'empty';
    referenceBalanceBrl: number;
    remainingPercent: number;
    averageDailySpendBrl: number;
    estimatedDaysRemaining?: number | null;
    message: string;
  };
  usageLimits: {
    requestsPerMinute: number;
    requestsPerDay: number;
    tokensPerDay: number;
    concurrentRequests: number;
  };
  usage: Array<{
    id: string;
    generationId?: string | null;
    feature: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedTokens: number;
    openRouterCostUsd: number;
    upstreamInferenceCostUsd: number;
    usdToBrlRate: number;
    markupPercent: number;
    chargedAmountBrl: number;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    status: string;
    amountBrl: number;
    balanceAfterBrl: number;
    description: string;
    createdAt: string;
    settledAt?: string | null;
  }>;
  topUps: Array<{
    id: string;
    amountBrl: number;
    status: string;
    dueDate: string;
    paidAt?: string | null;
    paymentMethod?: string | null;
    createdAt: string;
  }>;
}

export const aiBillingService = {
  getMine() {
    return apiRequest<AiBillingDashboard>('/api/ai-billing');
  },

  requestTopUp(amountBrl: number) {
    return apiRequest<AiBillingDashboard>('/api/ai-billing/top-ups', {
      method: 'POST',
      body: JSON.stringify({ amountBrl }),
    });
  },

  getEstablishment(establishmentId: string) {
    return apiRequest<AiBillingDashboard>(
      `/api/admin-master/establishments/${encodeURIComponent(establishmentId)}/ai-billing`,
    );
  },

  addCredit(establishmentId: string, amountBrl: number, description: string) {
    return apiRequest<AiBillingDashboard>(
      `/api/admin-master/establishments/${encodeURIComponent(establishmentId)}/ai-billing/credits`,
      {
        method: 'POST',
        body: JSON.stringify({ amountBrl, description }),
      },
    );
  },

  confirmTopUp(paymentId: string) {
    return apiRequest<AiBillingDashboard>(
      `/api/admin-master/ai-billing/top-ups/${encodeURIComponent(paymentId)}/confirm`,
      { method: 'POST' },
    );
  },
};
