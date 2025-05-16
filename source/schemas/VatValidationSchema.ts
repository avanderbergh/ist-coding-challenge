import { z } from "zod";
import { validationData } from "./ValidationRegexs";

const vatRegexMap: Record<string, RegExp> = Object.fromEntries(
  validationData.map(({ countryCode, regex }) => [
    countryCode,
    new RegExp(regex),
  ])
);

export const VatValidationSchema = z
  .object({
    countryCode: z
      .string()
      .length(2, { message: "Country code must be 2 characters" })
      .refine((code) => code in vatRegexMap, {
        message: "Unsupported country code",
        params: { statusCode: 501 },
      }),
    vat: z.string(),
  })
  .superRefine(({ countryCode, vat }, ctx) => {
    const pattern = vatRegexMap[countryCode];
    if (!pattern) return;
    if (!pattern.test(vat)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid VAT number for country ${countryCode}`,
        path: ["vat"],
        params: { statusCode: 400 },
      });
    }
  });

export type VatValidationType = z.infer<typeof VatValidationSchema>;
