# 0009 Facebook Page First Live Publishing

Date: 2026-06-16

## Status

Accepted

## Context

The UI presents multiple social channels, but each provider has different OAuth,
permission, app review, media, and publish API requirements. Trying to make all
providers real at once would slow down the first useful workflow.

## Decision

Treat Facebook Page as the first live publishing adapter. Keep Instagram,
Threads, TikTok, LinkedIn, and X as explicit demo adapters until each provider
gets a complete integration slice.

## Alternatives Considered

1. Build all providers at once.
2. Keep all channels as demo-only.

## Consequences

Positive:

- The app has one real publishing path.
- Tests can mock the Facebook Graph API.
- Product copy can stay honest.

Tradeoffs:

- Multi-channel UI is broader than real provider support.
- Provider-specific behavior still needs future slices.

## Follow-Up

- Add image/media support for Facebook Page.
- Add OAuth/app-review-backed integration stories one provider at a time.
