export const validationData = [
  {
    countryCode: "AT",
    regex: "^ATU[0-9]{8}$",
  },
  {
    countryCode: "BE",
    regex: "^BE[01][0-9]{9}$",
  },
  {
    countryCode: "BG",
    regex: "^BG[0-9]{9,10}$",
  },
  {
    countryCode: "CH",
    regex: "^CHE-[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}$",
  },
  {
    countryCode: "CY",
    regex: "^CY[0-9A-Z]{8}[A-Z]{1}$",
  },
  {
    countryCode: "CZ",
    regex: "^CZ[0-9]{8,10}$",
  },
  {
    countryCode: "DE",
    regex: "^DE[0-9]{9}$",
  },
  {
    countryCode: "DK",
    regex: "^DK[0-9]{8}$",
  },
  {
    countryCode: "EE",
    regex: "^EE[0-9]{9}$",
  },
  {
    countryCode: "EL",
    regex: "^(EL|GR)[0-9]{9}$",
  },
  {
    countryCode: "ES",
    regex: "^ES([0-9]{8}[A-Z])|([A-Z][0-9]{8})|([A-Z][0-9]{7}[A-Z])$",
  },
  {
    countryCode: "FI",
    regex: "^FI[0-9]{8}$",
  },
  {
    countryCode: "FR",
    regex: "^FR[0-9A-Z]{2}[0-9]{9}$",
  },
  {
    countryCode: "GB",
    regex: "^GB([0-9]{9}|[0-9]{12}|GD[0-9]{3}|HA[0-9]{3})$",
  },
  {
    countryCode: "HR",
    regex: "^HR[0-9]{11}$",
  },
  {
    countryCode: "HU",
    regex: "^HU[0-9]{8}$",
  },
  {
    countryCode: "IE",
    regex: "^IE[0-9]((([0-9]|[A-Z]|\\+\\*)[0-9]{5}[A-Z])|([0-9]{6}[A-Z]{2}))$",
  },
  {
    countryCode: "IT",
    regex: "^IT[0-9]{11}$",
  },
  {
    countryCode: "LT",
    regex: "^LT([0-9]{9}|[0-9]{12})$",
  },
  {
    countryCode: "LU",
    regex: "^LU[0-9]{8}$",
  },
  {
    countryCode: "LV",
    regex: "^LV[0-9]{11}$",
  },
  {
    countryCode: "MT",
    regex: "^MT[0-9]{8}$",
  },
  {
    countryCode: "NL",
    regex: "^NL[0-9]{9}B[0-9]{2}$",
  },
  {
    countryCode: "PL",
    regex: "^PL[0-9]{10}$",
  },
  {
    countryCode: "PT",
    regex: "^PT[0-9]{9}$",
  },
  {
    countryCode: "RO",
    regex: "^(RO)?[0-9]{2,10}$",
  },
  {
    countryCode: "SE",
    regex: "^SE[0-9]{12}$",
  },
  {
    countryCode: "SI",
    regex: "^SI[0-9]{8}$",
  },
  {
    countryCode: "SK",
    regex: "^SK[0-9]{10}$",
  },
] as const;
