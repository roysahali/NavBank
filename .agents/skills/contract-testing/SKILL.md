# SKILL.md — Contract Testing

## Overview
Rules for consumer-driven contract testing between services. Apply when one system calls another. Contract tests verify that both sides of an integration agree on the API contract — catching breaking changes before they reach production.

---

## What Contract Testing Is

A consumer-driven contract test defines what the consumer (caller) expects from the provider (callee), and verifies the provider actually delivers it.

```
Consumer (System A)         Provider (System B)
  writes a contract  ──→    runs the contract against itself
  "I expect POST /orders     "I verify my POST /orders
   to return { id, status }" returns { id, status }"
```

This catches the most common integration bug: System B changes its response shape and System A breaks silently.

---

## Using Pact (Consumer-Driven Contract Testing)

### Consumer side — define what you expect
```typescript
// In System A's test suite
const provider = new PactV3({
  consumer: 'order-service',
  provider: 'payment-service',
  dir: './pacts',
});

describe('payment service contract', () => {
  it('charges a payment', async () => {
    await provider
      .given('a valid payment method exists')
      .uponReceiving('a charge request')
      .withRequest({ method: 'POST', path: '/charges', body: { amount: 1000, currency: 'GBP' } })
      .willRespondWith({ status: 200, body: { id: like('ch_123'), status: like('succeeded') } })
      .executeTest(async (mockProvider) => {
        const result = await chargePayment(mockProvider.url, { amount: 1000 });
        expect(result.status).toBe('succeeded');
      });
  });
});
// Generates ./pacts/order-service-payment-service.json
```

### Provider side — verify you honour the contract
```typescript
// In System B's test suite
const verifier = new VerifierV3({
  provider: 'payment-service',
  providerBaseUrl: 'http://localhost:3001',
  pactUrls: ['./pacts/order-service-payment-service.json'],
  stateHandlers: {
    'a valid payment method exists': async () => {
      await seedTestPaymentMethod();
    }
  }
});

it('honours the order-service contract', () => verifier.verifyProvider());
```

---

## OpenAPI Contract Validation

For REST APIs, validate both request and response against the OpenAPI spec.

```typescript
// Middleware: validate requests match the OpenAPI spec
import { middleware } from 'express-openapi-validator';

app.use(middleware({
  apiSpec: './openapi.yaml',
  validateRequests: true,
  validateResponses: true,  // catches breaking changes in your own responses
}));
```

---

## Contract Testing Rules

- Consumer writes the contract, never the provider
- Contracts live in version control alongside the consumer code
- Provider must pass all consumer contracts in CI before deploying
- Never delete a contract until the consumer is updated
- Contract tests are not integration tests — run against mocks, run fast
- When you change an API: update the contract first, then implement the change

---

## When to Use Each Type

| Test type | Tests what | Uses real system? | Speed |
|-----------|-----------|-------------------|-------|
| Unit test | Business logic | No | Fast |
| Contract test | API shape agreement | No (mock) | Fast |
| Integration test | Real connection | Yes | Slow |
| E2E test | Full user flow | Yes | Slowest |

Run contract tests in CI on every PR. Run integration tests on merge to main only.

---

## Checklist

- [ ] Consumer-driven contract exists for every service-to-service call
- [ ] Pact files committed alongside consumer code
- [ ] Provider verifies all consumer contracts in its CI pipeline
- [ ] OpenAPI spec exists and is validated on every request/response
- [ ] Contract tests run fast (< 2 minutes total)
- [ ] Breaking changes flagged in PR before implementation
