export const PRODUCT = { name: 'Kristone Premium Acoustic Guitar', regularPrice: 12999, price: 9999, currency: 'NPR', deliveryFee: 0 } as const;
export const formatNpr = (amount: number) => `NPR ${amount.toLocaleString('en-IN')}`;
