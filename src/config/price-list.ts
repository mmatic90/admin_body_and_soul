export const PRICE_LIST_CONFIG = {
  businessId: process.env.PRICE_LIST_BUSINESS_ID?.trim() || "98508300",
  locationType:
    process.env.PRICE_LIST_LOCATION_TYPE?.trim() || "SALON_ZA_MASAZU",
  addressSlug:
    process.env.PRICE_LIST_ADDRESS_SLUG?.trim() || "ZAGREBACKA_12A_ROVINJ",
  locationCode: process.env.PRICE_LIST_LOCATION_CODE?.trim() || "PM01",
} as const;
