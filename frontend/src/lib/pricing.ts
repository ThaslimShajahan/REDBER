export type Region = 'INR' | 'USD' | 'GBP' | 'AED';
export type Plan = 'starter' | 'growth' | 'business';

export const CURRENCY_SYMBOLS: Record<Region, string> = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  AED: 'AED ',
};

export const DEFAULT_PRICING: Record<Region, Record<Plan, { monthly: number; yearly: number }>> = {
  INR: {
    starter:  { monthly: 5500,   yearly: 55000   },
    growth:   { monthly: 9999,   yearly: 100000  },
    business: { monthly: 18999,  yearly: 189990  },
  },
  AED: {
    starter:  { monthly: 349,    yearly: 3500    },
    growth:   { monthly: 549,    yearly: 5500    },
    business: { monthly: 749,    yearly: 7500    },
  },
  USD: {
    starter:  { monthly: 99,     yearly: 999     },
    growth:   { monthly: 149,    yearly: 1499    },
    business: { monthly: 199,    yearly: 1999    },
  },
  GBP: {
    starter:  { monthly: 79,     yearly: 749     },
    growth:   { monthly: 119,    yearly: 1149    },
    business: { monthly: 169,    yearly: 1589    },
  },
};

export const COUNTRY_TO_REGION: Record<string, Region> = {
  IN: 'INR',
  US: 'USD', CA: 'USD',
  GB: 'GBP',
  AE: 'AED', SA: 'AED', KW: 'AED', BH: 'AED', OM: 'AED', QA: 'AED',
};

export function formatPrice(region: Region, amount: number): string {
  const sym = CURRENCY_SYMBOLS[region];
  if (region === 'INR') {
    return sym + amount.toLocaleString('en-IN');
  }
  return sym + amount.toLocaleString('en-US');
}
