import { validationData } from "../schemas/ValidationRegexs";

export const isValidCountryCode = (code: string): boolean =>
  validationData.some(({ countryCode }) => countryCode === code);
