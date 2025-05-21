# VAT Validation Service

A Node.js/TypeScript Express service to validate VAT numbers for EU countries and Switzerland via external web services.

## Introduction

The VAT Validation Service (v1.0.0) provides a REST API endpoint to validate VAT numbers based on ISO 3166-1 alpha-2 country codes. It uses the [`VatValidationCoordinator`](/source/services/VatValidationCoordinator.ts) to orchestrate calls to the EU VIES and Swiss UID web services, offering a unified interface for internal use.

## Purpose

Many applications need to verify the validity of company VAT numbers for compliance and reporting. This service centralizes VAT validation logic, ensuring consistent request validation, error handling, and response formats across our systems. Under the hood, the [`VatValidationCoordinator`](/source/services/VatValidationCoordinator.ts) orchestrates validator implementations to simplify client interactions.

## Features

### Common Features

- Request validation using Zod schemas (countryCode and VAT number formats) is performed by the [`ValidationMiddleware`](/source/middleware/ValidationMiddleware.ts). This middleware ensures that:
    - The request body conforms to the expected schema.
    - The `countryCode` is supported by checking against a predefined map of VAT number regular expressions (`vatRegexMap`). Unsupported country codes result in a 501 error, so the coordinator only receives valid and supported country codes.
    - The VAT number format is valid for the given `countryCode` according to its regex pattern, returning a 400 error if not.
- Orchestrates calls via the [`VatValidationCoordinator`](/source/services/VatValidationCoordinator.ts). This coordinator:
    - Implements the `VatValidator` interface.
    - Takes a `RegionValidators` object in its constructor, mapping 'ch' and 'eu' to their respective validator instances.
    - Routes validation requests. It uses a simple `if (countryCode === "CH")` check to direct requests to the Swiss validator. For all other country codes, it safely falls back to the EU validator. This is robust because the preceding `ValidationMiddleware` guarantees that any non-CH country code reaching the coordinator is a supported one (implicitly an EU country in the current setup).
    - This design allows for straightforward extension; additional country-specific validators (e.g., for the UK post-Brexit) could be added with similar explicit checks, while the EU validator serves as a general fallback for other supported EU nations.
- All specific validators (EU and Swiss) extend the [`RetryableVatValidator`](/source/services/RetryableVatValidator.ts) base class, which provides common retry and timeout logic:
    - Implements a retry mechanism with exponential backoff and jitter. The default maximum number of retries is 5, and the base delay is 1000ms.
    - Respects `Retry-After` headers from services when present.
    - Handles specific HTTP status codes (429, 5xx) and network errors (`TypeError`) as retryable conditions.
    - Uses a custom `VatValidationError` class to convey error details, including whether an error is retryable.
    - Includes a `fetchWithTimeout` utility (default 5 seconds timeout) for all outgoing HTTP requests, using an `AbortController` to cancel requests that exceed the timeout.
- Express-based REST API with JSON request/response.
- OpenAPI 3.1 specification for API documentation.
- Fully tested with Jest and Supertest (>=80% coverage).

### 🇪🇺 EU VIES REST API

- Uses the public endpoint `https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number`, which itself forwards to national VIES systems.
- It constructs a JSON payload, notably sending the VAT number without its country code prefix (e.g., using `vat.slice(2)`).
- Responses are validated against a Zod schema (`VatApiResponseSchema`) defined in [`EUVatValidator.ts`](/source/services/EUVatValidator.ts).
- Chosen for smaller JSON payloads and simpler integration versus SOAP.
- Subject to a global concurrent-request limit; returns `MS_MAX_CONCURRENT_REQ` when exceeded. The validator specifically handles this error as retryable.
- It also handles `MS_UNAVAILABLE` errors (non-retryable) from the VIES API.
- Retryable backend logic handles transient issues via exponential backoff (with jitter) and respects `Retry-After` headers.

### 🇨🇭 Swiss UID SOAP API

- Targets the stable versioned endpoint `https://www.uid-wse.admin.ch/V5.0/PublicServices.svc` without dynamic WSDL parsing.
- Implements hard-coded SOAP envelope generation in [`CHVatValidator.ts`](/source/services/CHVatValidator.ts), specifically using an internal `generateSoapEnvelope` method to create the XML body.
- Response parsing relies on regular expressions to extract the validation result from the `<ValidateVatNumberResult>` tag and to detect SOAP faults.
- Avoids additional `soap` dependencies, keeping the service lightweight for a single SOAP action.

## Usage

### Prerequisites

- Node.js 22.13 or newer
- pnpm

### Installation

```bash
cd /path/to/ist-coding-challenge
pnpm install
```

### Running Locally

```bash
# Development mode with auto-reload
pnpm dev

# Build and start production server
pnpm build
pnpm start
```

The server listens on port 3000 by default: http://localhost:3000

### Example Request

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/json" \
  -d '{"countryCode":"DE","vat":"DE123456789"}'
```

**Successful Response (200)**

```json
{
  "validated": true,
  "details": "VAT number is valid for the given country code."
}
```

**Validation Error (400)**

```json
{
  "code": 400,
  "message": "Invalid VAT number for country DE"
}
```

**Unsupported Country (501)**

```json
{
  "code": 501,
  "message": "Unsupported country code XX"
}
```

## API Documentation

Full API definition is available in [`docs/openapi.yaml`](./openapi.yaml). The OpenAPI specification is also served at the `/api-spec` route of the running application.

You can also paste the content of this file into the [Swagger Editor](https://editor-next.swagger.io/) to view the documentation.

## Configuration

- The application loads its configuration from [`config.json`](../config.json) at startup. This file is read by the `readAppConfiguration` function in [`source/models/ConfigurationModel.ts`](/source/models/ConfigurationModel.ts).
- The `config.json` file specifies:
    - `port`: The port number on which the Express server will listen (e.g., 3000).
    - `expressServerOptions`: An object containing various Node.js HTTP server settings that are applied directly to the server instance in `app.ts`. These include:
        - `keepAliveTimeout`
        - `headersTimeout`
        - `timeout`
        - `requestTimeout`
        - `maxConnections`
        - `maxHeadersCount`

## Dependencies

- [express](https://www.npmjs.com/package/express) 5.1.0
- [zod](https://www.npmjs.com/package/zod) 3.25.7
- [helmet](https://www.npmjs.com/package/helmet) 8.1.0
- [response-time](https://www.npmjs.com/package/response-time) 2.3.3

Dev dependencies:

- [@biomejs/biome](https://www.npmjs.com/package/@biomejs/biome) ^1.9.4
- [@jest/globals](https://www.npmjs.com/package/@jest/globals) 29.7.0
- [jest](https://www.npmjs.com/package/jest) 29.7.0
- [jest-junit](https://www.npmjs.com/package/jest-junit) 16.0.0
- [supertest](https://www.npmjs.com/package/supertest) 7.0.0
- [ts-jest](https://www.npmjs.com/package/ts-jest) 29.2.5
- [tsx](https://www.npmjs.com/package/tsx) ^4.19.4
- [typescript](https://www.npmjs.com/package/typescript) 5.3.3

## Contributing

1. Fork the repository and create a feature branch.
2. Run `pnpm install` and commit formatting via `pnpm format`.
3. Add tests for new features and ensure coverage remains >=80%.
4. Submit a pull request and reference the issue.

## License

This project is **UNLICENSED** and intended for internal use only.
