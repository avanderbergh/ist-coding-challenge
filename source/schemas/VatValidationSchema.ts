import { z } from "zod";
import { validationData } from "./ValidationData";

export const vatRegexMap: Record<string, RegExp> = Object.fromEntries(
  validationData.map(({ countryCode, regex }) => [
    countryCode,
    new RegExp(regex),
  ])
);

export const VatValidationSchema = z.object({
  countryCode: z
    .string({ message: "'countryCode' is required" })
    .length(2, { message: "Country code must be 2 characters" }),
  vat: z
    .string({ message: "'vat' is required" })
    .min(3, { message: "VAT number must be at least 3 characters" }),
});

export type VatValidationType = z.infer<typeof VatValidationSchema>;
