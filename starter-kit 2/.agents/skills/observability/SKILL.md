# SKILL.md — Observability

## Overview
Standards for structured logging, metrics, and tracing. Apply to every API endpoint, background job, and integration point. Good observability means you know what is wrong in production before users report it.

---

## Structured Logging Rules

### Always log as JSON — never plain strings
✅ Structured:
```typescript
logger.info({ event: 'order.created', orderId, userId, amount, durationMs: 42 });
logger.error({ event: 'payment.failed', orderId, error: err.message, code: err.code });
```
❌ Unstructured:
```typescript
console.log(`Order ${orderId} created by user ${userId}`);  // unsearchable
console.error('Payment failed: ' + err.message);
```

### Required fields on every log entry
```typescript
{
  timestamp: ISO8601,      // set by logger, not manually
  level: 'info'|'warn'|'error'|'debug',
  event: 'noun.verb',      // machine-readable event name
  traceId: string,         // correlation ID — same for all logs in one request
  service: string,         // service name from env
  environment: string,     // 'production'|'staging'|'dev'
  // plus event-specific fields
}
```

### Never log sensitive data
❌ Never log: passwords, tokens, credit card numbers, SSNs, full email addresses
✅ Log masked versions: `user@***.com`, last 4 digits, `[REDACTED]`

### Log levels — use consistently
- `debug` — detailed internal state, disabled in production
- `info` — normal operations: request received, job completed, user logged in
- `warn` — degraded but functioning: retry succeeded, fallback used, slow query
- `error` — operation failed, needs attention: payment failed, integration down

---

## Correlation IDs

Every request gets a unique trace ID that flows through all logs and downstream calls.

```typescript
// Middleware: generate or propagate trace ID
app.use((req, res, next) => {
  req.traceId = req.headers['x-trace-id'] ?? crypto.randomUUID();
  res.setHeader('x-trace-id', req.traceId);
  next();
});

// Pass trace ID to downstream services
await fetch(upstreamUrl, {
  headers: { 'x-trace-id': req.traceId }
});

// Include in every log
logger.info({ traceId: req.traceId, event: 'order.processing' });
```

---

## Key Metrics to Instrument

Every service must expose these:

```typescript
// Request rate, error rate, duration (RED metrics)
requestCount.inc({ method, route, status });
requestDuration.observe({ method, route }, durationMs);
errorRate.inc({ method, route, errorCode });

// Business metrics (domain-specific)
ordersCreated.inc({ currency, channel });
paymentFailed.inc({ reason, provider });

// Integration health
integrationLatency.observe({ service: 'stripe' }, durationMs);
integrationErrors.inc({ service: 'stripe', errorType });
```

---

## Health Check Endpoint

Every service must expose a health endpoint:

```typescript
// GET /health — returns 200 if healthy, 503 if not
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    // add each integration
  };
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks });
});
```

---

## Alerting Rules

Define alerts for every service before it goes to production:

| Metric | Alert threshold | Severity |
|--------|----------------|----------|
| Error rate | > 1% over 5 min | High |
| p95 latency | > 2x baseline | Medium |
| Health check failing | > 30 seconds | Critical |
| Integration error rate | > 5% over 5 min | High |
| Queue depth | > 10,000 messages | Medium |

---

## Checklist

- [ ] All log output is structured JSON
- [ ] Every log entry has `traceId`, `event`, `service`, `environment`
- [ ] No sensitive data in any log entry
- [ ] Correlation ID generated and propagated through all downstream calls
- [ ] RED metrics instrumented on all API endpoints
- [ ] Health check endpoint returns dependency status
- [ ] Alerts defined for error rate, latency, and health failures
- [ ] Log levels used consistently (no `console.log` in production code)
