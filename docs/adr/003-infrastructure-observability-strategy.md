# ADR-003: Infrastructure & Observability Strategy

## Status
Accepted

## Context

The application is deployed as a single workload on a managed EC2 instance (or comparable VM) using Docker Compose. The Spring Boot backend exposes the API and serves the built React frontend behind the same reverse proxy (Nginx). Even though we are not splitting the stack across S3/CloudFront or ECS, we still need consistent observability and deployment guidance that mirrors production expectations.

## Decision

1. **Environment separation** – maintain separate Compose override files and parameter sets for `dev`, `staging`, and `production` servers (different `.env` files, domains, TLS certificates).
2. **Centralised logging** – install the CloudWatch Agent on the host to ship the backend container's stdout/stderr to environment-specific log groups (e.g., `/tasks/dev/backend`). Retain logs for 14 days in non-production, 30 days in production.
3. **Metrics & alarms** – use the CloudWatch Agent to publish host-level metrics (CPU, memory, disk) and container-specific metrics. Set alarms for backend response latency, 5xx error count (via Spring Actuator metrics), and database resource usage.
4. **MDC standard** – backend logs must include a random `traceId` per request and a `userId` derived from the authenticated principal (or `anonymousUser`/`unknown`). The `LoggingContextInterceptor` is responsible for seeding MDC and clearing it after completion.

## Rationale

- Using a single server keeps operations simple while we iterate; environment-specific overrides prevent configuration drift.
- CloudWatch Agent ships backend logs without altering the application; JSON payloads already include `traceId` and `userId` fields per the interceptor and can be queried directly with Logs Insights.
- Metrics/alarms surface regressions (e.g., drag-and-drop causing PATCH spikes) before users report them.
- Consistent MDC keys allow tracing a user interaction from browser to API within mixed Nginx + Spring logs.

## Implementation Notes

- **Host provisioning** – use the existing `infrastructure/` CloudFormation templates only for networking/VPC when needed. For single-server environments, provision an EC2 instance (Amazon Linux 2023) with security groups allowing HTTP/HTTPS and database traffic as required.
- **Reverse proxy** – Nginx terminates TLS, serves the built frontend from `/var/www/tasks-frontend`, and proxies `/api` requests to the Spring Boot container. Nginx access logs include `$request_id` which is forwarded as `X-Request-Id` upstream.
- **Container orchestration** – Docker Compose stack runs `backend`, `frontend-build` (executed during CI to produce static assets), and `postgres`. Production deployments copy the built frontend into the backend container or mount it for Nginx to serve directly.
- **Logging pipeline**:
  - CloudWatch Agent tails the backend container's stdout logs under `/var/lib/docker/containers/*/backend-*.log` and ships them to the configured log group.
  - Spring Boot logback appender outputs JSON with MDC fields so Logs Insights can filter on `traceId` or `userId`.
  - The agent configuration maps each environment to an explicit log group (e.g., `/tasks/prod/backend`).
- **Trace propagation**:
  - `LoggingContextInterceptor` seeds MDC with a new UUID `traceId` and the resolved `userId` for each request. Future enhancements may replace the random UUID with a client-provided header.
  - MDC enrichment applies to all subsequent logs (controller, service, repository) and is cleared in `afterCompletion`; this keeps CloudWatch queries consistent.

## Consequences

- Servers must keep their CloudWatch Agent configs in sync; drift can break log shipping.
- CloudWatch ingestion costs can grow; apply retention policies and keep application logs at INFO in production.
- All HTTP clients (frontend, future integrations) need to honour the `X-Trace-Id` contract for correlation.
