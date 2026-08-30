export type DeliveryZone = 'kathmandu_valley' | 'outside_valley' | 'remote';

export type DeliveryAssessment = {
  zone: DeliveryZone;
  charge: number | null;
  chargeLabel: string;
  totalLabel: string;
  note: string;
  isFree: boolean;
};

export type DeliveryLocation = {
  province: string;
  district: string;
  municipality: string;
  fullAddress: string;
};

const KATHMANDU_VALLEY_DISTRICTS = new Set(['kathmandu', 'lalitpur', 'bhaktapur']);
const REMOTE_KEYWORDS = ['remote', 'gorkha', 'manang', 'mustang', 'dolpa', 'humla', 'mugu', 'jumla'];

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

export const DELIVERY_RATE_CONFIG = {
  valleyFreeLabel: 'FREE DELIVERY IN KATHMANDU',
  outsideValleyLabel: 'Delivery charge calculated based on location and courier rate',
  remoteLabel: 'Delivery charge confirmed separately',
  districtCharges: {} as Record<string, number>,
};

export function resolveDeliveryAssessment(location: DeliveryLocation) {
  const province = normalize(location.province);
  const district = normalize(location.district);
  const municipality = normalize(location.municipality);
  const fullAddress = normalize(location.fullAddress);

  const valleyMatch = province.includes('bagmati') && KATHMANDU_VALLEY_DISTRICTS.has(district);
  if (valleyMatch) {
    return {
      zone: 'kathmandu_valley' as const,
      charge: 0,
      chargeLabel: DELIVERY_RATE_CONFIG.valleyFreeLabel,
      totalLabel: 'NPR 9,999',
      note: `${DELIVERY_RATE_CONFIG.valleyFreeLabel}.`,
      isFree: true,
    };
  }

  const areaKey = [province, district, municipality].filter(Boolean).join(' | ');
  const configuredCharge = DELIVERY_RATE_CONFIG.districtCharges[areaKey] ?? DELIVERY_RATE_CONFIG.districtCharges[district];
  if (typeof configuredCharge === 'number' && Number.isFinite(configuredCharge)) {
    return {
      zone: 'outside_valley' as const,
      charge: configuredCharge,
      chargeLabel: `NPR ${configuredCharge.toLocaleString('en-IN')}`,
      totalLabel: `NPR ${(9999 + configuredCharge).toLocaleString('en-IN')}`,
      note: DELIVERY_RATE_CONFIG.outsideValleyLabel,
      isFree: false,
    };
  }

  const isRemote = REMOTE_KEYWORDS.some(keyword => fullAddress.includes(keyword) || district.includes(keyword) || municipality.includes(keyword));
  return {
    zone: isRemote ? ('remote' as const) : ('outside_valley' as const),
    charge: null,
    chargeLabel: isRemote ? 'Confirmed separately' : 'Calculated after review',
    totalLabel: 'To be confirmed',
    note: isRemote ? DELIVERY_RATE_CONFIG.remoteLabel : 'Delivery charge for locations outside Kathmandu Valley will be calculated based on your delivery location and confirmed by our team.',
    isFree: false,
  };
}
