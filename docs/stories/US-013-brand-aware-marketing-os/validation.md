# Validation

## Proof Strategy

Prove backend resource compatibility and the unified browser workflow without
changing authentication or provider publishing behavior.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Status helpers and filters compile through TypeScript. |
| Integration | Authenticated brand/channel/campaign/content CRUD and bootstrap relationships. |
| E2E | Create brand-aware content, schedule it, reopen it, and complete manual publish. |
| Platform | Responsive desktop/mobile browser smoke. |
| Performance | No new large dependency or network request. |
| Logs/Audit | Harness trace and story evidence. |

## Fixtures

- One primary brand with two channels.
- One campaign belonging to that brand.
- Content records in multiple statuses.

## Commands

```text
npm run build
npm run test:api
```

## Acceptance Evidence

- `npm run build` passed.
- `npm run test:api` passed 3/3.
- Browser smoke confirmed all six page titles and matching header CTAs.
- Browser smoke confirmed `Cài đặt` is an auxiliary sidebar item with no
  primary CTA.
- Browser smoke found none of the removed demo labels/names in the rendered UI.
- Composer showed Brand-filtered Channel/Campaign fields, checklist, and Brand
  Context.
- Manual publish modal exposed caption copy, media/channel links, published URL,
  learning note, and Published/Failed result.
- Mobile viewport had no horizontal document overflow.
- API smoke asserts old fake team member names and fake alert titles are absent
  from bootstrap seed data.
