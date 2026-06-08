export const formatPrice = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0 EGP";
  }
  return `${amount.toLocaleString("en-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} EGP`;
};
