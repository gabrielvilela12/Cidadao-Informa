const brazilianCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | null | undefined, fallback = '—') {
  return typeof value === 'number' && Number.isFinite(value)
    ? brazilianCurrencyFormatter.format(value)
    : fallback;
}
