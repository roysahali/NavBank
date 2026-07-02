# SKILL.md — Integration Patterns

## Overview
Resilience and integration design patterns for multi-system projects. Apply whenever one system calls another. These patterns prevent cascading failures when external systems are slow or unavailable.

---

## Circuit Breaker

Stops calling a failing service to give it time to recover.

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed'|'open'|'half-open' = 'closed';

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > 30_000) this.state = 'half-open';
      else throw new Error('Circuit open — service unavailable');
    }
    try {
      const result = await fn();
      if (this.state === 'half-open') { this.failures = 0; this.state = 'closed'; }
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= 5) this.state = 'open';
      throw err;
    }
  }
}

// One breaker per external dependency
const stripeBreaker = new CircuitBreaker();
await stripeBreaker.call(() => stripe.charges.create(data));
```

---

## Retry with Exponential Backoff

Retry transient failures with increasing delays. Never retry immediately in a tight loop.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      // Only retry transient errors — not 4xx client errors
      if (err.status >= 400 && err.status < 500) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 100;
      await sleep(delay); // jitter prevents thundering herd
    }
  }
}
```

---

## Idempotency

Every write operation must be safe to call more than once with the same outcome.

```typescript
// Client: generate and send idempotency key
const idempotencyKey = `order-${orderId}-payment`;
await stripe.paymentIntents.create(data, {
  idempotencyKey  // same key = same result, no duplicate charge
});

// Server: check-and-insert pattern for your own endpoints
async function createOrder(data: OrderData, idempotencyKey: string) {
  const existing = await db.order.findUnique({ where: { idempotencyKey } });
  if (existing) return existing;  // return cached result, don't re-process

  return await db.order.create({
    data: { ...data, idempotencyKey }
  });
}
```

---

## Outbox Pattern (reliable event publishing)

Guarantees an event is published even if the service crashes after writing to the database.

```typescript
// Write to outbox in same transaction as the business operation
await db.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.outbox.create({  // same transaction
    data: { eventType: 'order.created', payload: JSON.stringify(order), status: 'pending' }
  });
});

// Separate process publishes outbox events
async function processOutbox() {
  const events = await db.outbox.findMany({ where: { status: 'pending' } });
  for (const event of events) {
    await messageBus.publish(event.eventType, event.payload);
    await db.outbox.update({ where: { id: event.id }, data: { status: 'sent' } });
  }
}
```

---

## Saga Pattern (distributed transactions)

When a business operation spans multiple services, use a saga to manage rollback.

```typescript
// Orchestration saga — one coordinator calls each step
async function createOrderSaga(orderData: OrderData) {
  const order = await orderService.create(orderData);
  try {
    await inventoryService.reserve(order.id, orderData.items);
    try {
      await paymentService.charge(order.id, orderData.payment);
    } catch (err) {
      await inventoryService.release(order.id);  // compensate
      throw err;
    }
  } catch (err) {
    await orderService.cancel(order.id);           // compensate
    throw err;
  }
}
```

---

## Checklist

- [ ] Circuit breaker on every external service call
- [ ] Retry with exponential backoff + jitter (never retry 4xx)
- [ ] Idempotency key on all write operations to external services
- [ ] Outbox pattern for any event that must be published reliably
- [ ] Saga pattern for multi-service transactions with compensation
- [ ] Timeout set on every external call (never wait forever)
- [ ] Bulkhead: separate thread pool/connection pool per external service
