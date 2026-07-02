# SKILL.md — Data Mapping

## Overview
Rules for transforming data in-flight between systems. Apply whenever receiving data from an external system or sending data to one. These rules prevent the most common integration data bugs: silent field loss, type coercion errors, and broken mappings.

---

## Mapping Rules

### Always validate incoming data at system boundaries
Never trust data from external systems. Validate before using:

```typescript
import { z } from 'zod';

const StripeWebhookPayload = z.object({
  id: z.string().startsWith('evt_'),
  type: z.string(),
  data: z.object({
    object: z.object({
      id: z.string(),
      amount: z.number().int().positive(),
      currency: z.string().length(3),
      status: z.enum(['succeeded', 'pending', 'failed']),
    })
  })
});

function handleStripeWebhook(raw: unknown) {
  const parsed = StripeWebhookPayload.safeParse(raw);
  if (!parsed.success) {
    logger.error({ event: 'webhook.invalid', errors: parsed.error.flatten() });
    return; // reject, don't process
  }
  processCharge(parsed.data);
}
```

### Define explicit field maps — never implicit spread
✅ Explicit mapping — changes to source schema are caught:
```typescript
function mapStripeCharge(charge: Stripe.Charge): PaymentRecord {
  return {
    externalId: charge.id,
    amount: charge.amount,           // Stripe: pence/cents
    amountFormatted: charge.amount / 100,  // convert to pounds/dollars
    currency: charge.currency.toUpperCase(),
    status: mapStripeStatus(charge.status),
    createdAt: new Date(charge.created * 1000),  // Stripe uses Unix seconds
    metadata: {
      stripeCustomerId: charge.customer as string,
      receiptEmail: charge.receipt_email ?? null,
    }
  };
}
```

❌ Implicit spread — source changes silently break target:
```typescript
function mapStripeCharge(charge: Stripe.Charge) {
  return { ...charge }; // includes everything, undefined fields, wrong types
}
```

---

## Type Coercion Rules

| Source type | Target type | Rule |
|------------|------------|------|
| Unix timestamp (seconds) | JavaScript Date | `new Date(ts * 1000)` — never `new Date(ts)` |
| ISO8601 string | Date | `new Date(isoString)` — validate first |
| Money integer (pence) | Decimal display | Divide by 100 at the boundary, never store divided |
| Currency code | Always uppercase | `.toUpperCase()` — sources are inconsistent |
| Nullable field | Non-nullable | `value ?? defaultValue` — explicit default |
| Boolean "1"/"0" string | Boolean | `value === '1'` — never `Boolean(value)` |
| Empty string | Null | `value === '' ? null : value` — treat as absent |

---

## Error Handling for Mapping Failures

```typescript
function safeMap<TSource, TTarget>(
  data: TSource,
  mapper: (d: TSource) => TTarget,
  context: string
): TTarget | null {
  try {
    return mapper(data);
  } catch (err) {
    logger.error({
      event: 'mapping.failed',
      context,
      error: err.message,
      // Never log the full data if it may contain PII
      dataShape: Object.keys(data as object)
    });
    return null; // caller decides how to handle null
  }
}
```

---

## Checklist

- [ ] All data from external sources validated with a schema (Zod, Joi, etc.)
- [ ] All field mappings explicit — no object spread across system boundaries
- [ ] Unix timestamps multiplied by 1000 before constructing Date
- [ ] Money stored as integer (pence/cents) — converted at presentation only
- [ ] Currency codes normalised to uppercase
- [ ] Empty strings treated as null at system boundaries
- [ ] Mapping failures logged with context but without PII
- [ ] Schema version checked on incoming messages
