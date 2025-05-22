import type { Request, Response } from "express";
import type { VatValidationType } from "../schemas/VatValidationSchema.js";
import type { VatValidator } from "../services/VatValidationCoordinator.js";

export default class VatValidationController {
  constructor(private readonly service: VatValidator) {}

  async validateVatNumber(req: Request, res: Response) {
    const { countryCode, vat }: VatValidationType = req.body;
    const validated = await this.service.validate(countryCode, vat);

    res.status(200).json({
      validated,
      details: `VAT number is ${validated ? "valid" : "invalid"} for the given country code.`,
    });
  }
}
