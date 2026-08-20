# Xtreme Visualizer Overnight Autonomy

## Objective
Keep making safe, evidence-backed progress while the operator is offline until the autonomous engineering score reaches 100/100 or only protected approval/external gates remain.

## Canonical validator

```bash
npm run validate:overnight
```

The validator writes transient receipts and score state under `.validation/`, which is gitignored.

## Autonomous completion state
`AUTONOMOUS_COMPLETE` means:

- exact final SHA/tree recorded before and after validation
- working tree clean
- npm ci passes
- lint passes
- full frontend/backend typecheck passes
- unit suite passes
- payment regression passes
- build passes
- high/critical audit threshold passes
- desktop functional routes 9/9 pass
- mobile functional routes 9/9 pass
- base44Client module regression passes in both projects
- response-contract regressions 7/7 pass in both projects
- 12 governed review screenshots pass capture-integrity checks
- receipts are complete

It does **not** mean production release is approved. Protected gates are tracked separately.

## Safe autonomous loop

1. Read current Git SHA, tree, status, and release evidence.
2. Run `npm run validate:overnight`.
3. Read `.validation/current-score.json`.
4. If score is 100, stop autonomous repair and prepare the operator approval packet.
5. If score is below 100, identify only failed autonomous-safe gates.
6. Repair only test harness, validation infrastructure, documentation, deterministic mocks, or other non-visual/non-production safe scope.
7. Never manufacture a pass. Never update snapshots to make visual tests green.
8. Re-run the validator on the new exact SHA.
9. Create a failure receipt for every failed iteration, including root cause, evidence, repair, and next validation step.
10. Repeat until score reaches 100 or the remaining blocker requires operator approval or an external provider action.

## Protected gates
The autonomous loop must stop before:

- visual baseline promotion
- intentional visual or visible-content changes
- GitHub CI activation on protected production workflow
- branch protection changes
- OAuth consent
- Twilio visible URL replacement
- Twilio carrier verification
- Twilio secret migration or env changes
- production deployment
- paid Browserbase or other incremental spend
- destructive changes
- customer/vendor/team messages
- payments or billing

## Browser fallback
Local Playwright is primary. If local browser infrastructure fails, Browserbase may be used only when it is already authorized and causes no incremental spend. If Browserbase requires spend or new credentials, create an approval request and continue with other safe work.

## Snapshot safety
Every browser validation command must use:

```bash
--update-snapshots=none
```

Review images are evidence only until explicitly approved. Never auto-promote them into `e2e/visual.spec.ts-snapshots/`.

## Scoring
The committed scoring policy is `validation-score-policy.json`.

The autonomous engineering score is separate from protected release gates. A 100/100 autonomous score is allowed only when every weighted gate executed and passed on the exact final SHA. Production release remains blocked until required protected gates are completed with explicit evidence.

## Morning handoff
The overnight summary should report:

- final SHA/tree
- autonomous score
- gates passed/failed
- retries and repairs performed
- current review screenshot evidence
- unresolved approval/external gates
- exact operator decisions needed
- whether release candidate is ready for protected-gate completion
