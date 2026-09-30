---
name: admin-audit-log
description: "Use when admins, staff, or support can perform destructive or sensitive actions such as deleting users, changing roles, issuing refunds, exporting data, impersonating, or changing settings, and you need to check that these actions leave a durable who-did-what record without storing secrets. Do not use it to build a logging platform, to log passwords, tokens, or full personal data, or when no privileged actions exist."
license: Apache-2.0
metadata:
  kind: specialist
  compliance-domains: "10,6"
  launch-checks: "38"
---

# admin-audit-log

When something goes wrong, "who changed that?" is the first question. Without a record, you cannot answer, and you cannot show a user how their data was handled. But an audit log that stores passwords or full personal data becomes its own incident.

## Activate when

- Privileged actions exist (`admin-authorization` lists them) and are destructive or sensitive.
- Before launch of anything with staff/support access to user data, and whenever `admin-dashboard` adds destructive actions.
- Not when there are no privileged actions, and not to add analytics or product telemetry.

## Inspect

1. **Action list:** from `admin-authorization`: user deletion/suspension, role changes, refunds/credits, data exports, impersonation/"login as", content removal, settings/feature-flag changes, key/webhook changes, bulk operations.
2. **Is each recorded?** Find the code path; is there an append-only record with: actor (user ID, not just name), action, target object ID/type, timestamp (UTC), source (IP/request ID, optionally), and outcome? A `console.log` is not an audit log.
3. **Content of the record:** describes *what* changed (fields changed, old→new for non-sensitive fields, or a diff summary), not secrets. No passwords, tokens, API keys, full card data, or full personal data payloads (reference IDs instead).
4. **Integrity and access:** logs not editable by the actors they describe (append-only table, restricted DB privileges, or an external log sink); readable only by appropriate roles (`admin-authorization`); retention stated by the owner (unspecified = indefinite).
5. **Coverage of failure and bulk:** failed/denied attempts on sensitive actions; bulk deletes logged as individual or grouped events with counts.
6. **Privacy consistency:** the audit log's personal data (actor and target identifiers) is considered by deletion/retention decisions (`data-rights`) and the notice (`privacy-policy`) where staff access to user data is disclosed.
7. **Usability for incidents:** can the owner actually query "who did X to user Y"? A table nobody can read is not a control.

## Evidence that counts

Label each claim OBSERVED, SOURCE-INDICATED, DECLARED, INFERRED, UNKNOWN, or REVIEW REQUIRED. UNKNOWN is never a pass and never a failure.

- An entry created when you perform the action on a local/staging test: OBSERVED. Logging code seen: SOURCE-INDICATED.
- Provider-side logs (auth provider, hosting) may cover some actions: DECLARED/UNKNOWN unless the owner shows them.

## May change

Add a minimal append-only audit table/logger and calls at existing privileged handlers following the project's patterns; strip secrets from existing log statements; add restricted read access. Keep it small: actor, action, target, time, details-without-secrets. Do not build dashboards, external SIEM integrations, or retention policies.

## Must not claim

"Audit-ready", "tamper-proof", or "compliant logging". Describe what is recorded and what is not.

## Verify

On local/staging: perform each privileged action and confirm one entry with the right fields and no secrets; try a denied attempt; confirm a normal user cannot read or edit the log; confirm log entries survive a restart.

## Escalate

Staff access to sensitive or regulated data (need access reviews and formal controls), impersonation features, retention obligations, or incidents.

## No change is valid when

No privileged or destructive actions exist, or they are already logged with the right fields and no secrets. Do not create a log for its own sake.
