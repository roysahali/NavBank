# SKILL.md — Event-Driven Architecture

## Overview
Standards for message queue producers, consumers, and event design. Apply whenever a system communicates asynchronously via Kafka, RabbitMQ, SQS, Pub/Sub, or similar. These rules prevent the most common async bugs: lost messages, duplicate processing, and ordering violations.

---

## Event Design Rules

### Event naming: past tense, domain.action
```
order.created       payment.succeeded      user.registered
order.cancelled     payment.failed         inventory.reserved
shipment.dispatched subscription.renewed   session.expired
```

### Event envelope — standard wrapper for all events
```typescript
interface DomainEvent<T> {
  id: string;           // UUID — unique event identifier
  type: string;         // 'order.created'
  version: string;      // '1.0' — for schema evolution
  source: string;       // 'order-service' — which system emitted
  timestamp: string;    // ISO8601
  correlationId: string;// trace ID — links to the originating request
  payload: T;           // event-specific data
}
```

---

## Consumer Rules

### Always make consumers idempotent
The same message may be delivered more than once. Handle it:

```typescript
async function handleOrderCreated(event: DomainEvent<Order>) {
  // Check if already processed
  const processed = await db.processedEvents.findUnique({ where: { eventId: event.id } });
  if (processed) return; // Already handled — skip

  // Process the event
  await fulfillmentService.createShipment(event.payload);

  // Record as processed in same transaction
  await db.processedEvents.create({ data: { eventId: event.id, processedAt: new Date() } });
}
```

### Dead-letter queue for failures
```typescript
async function processMessage(message: Message) {
  try {
    await handleEvent(JSON.parse(message.body));
    await message.ack();
  } catch (err) {
    if (message.deliveryCount >= 3) {
      logger.error({ event: 'message.dead-lettered', messageId: message.id, error: err.message });
      await message.deadLetter(); // send to DLQ for manual inspection
    } else {
      await message.nack(); // return to queue for retry
    }
  }
}
```

---

## Producer Rules

### Transactional outbox — never publish without persisting first
```typescript
// WRONG: publish then persist — message lost if crash between the two
await messageBus.publish('order.created', order);
await db.order.update({ where: { id }, data: { status: 'processing' } });

// RIGHT: outbox pattern (see integration-patterns skill)
await db.$transaction(async (tx) => {
  await tx.order.update({ where: { id }, data: { status: 'processing' } });
  await tx.outbox.create({ data: { type: 'order.created', payload: JSON.stringify(order) } });
});
```

---

## Schema Evolution Rules

- Never remove a field from an event schema — add new fields instead
- New required fields must have default values (backwards compatibility)
- Use the `version` field to handle multiple schema versions:

```typescript
async function handleEvent(event: DomainEvent<unknown>) {
  switch (event.version) {
    case '2.0': return handleV2(event.payload as OrderV2);
    case '1.0': return handleV1(event.payload as OrderV1);
    default: logger.warn({ event: 'unknown.version', version: event.version });
  }
}
```

---

## Checklist

- [ ] All events use standard envelope (`id`, `type`, `version`, `correlationId`)
- [ ] All consumers are idempotent (check eventId before processing)
- [ ] Dead-letter queue configured on every consumer
- [ ] Outbox pattern used for all event publishing
- [ ] Event schemas are versioned and backwards-compatible
- [ ] Consumers process one message at a time per partition/shard
- [ ] Message retention configured (minimum 7 days for replay capability)
- [ ] Alerts on DLQ depth > 0
