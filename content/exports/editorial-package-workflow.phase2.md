# Editorial Package Workflow (Phase 2)

This workflow standardizes transcript-to-lesson delivery for curriculum updates.

## Package Inputs

- Transcript source files.
- Lesson copy draft (steps plus content html).
- Assessment bank draft (mcq, truefalse, match).
- Scope note: core, advanced, or lineage-specific.

## Step 1: Editorial Framing

- Define lesson outcome in one sentence.
- List 3 to 5 non-negotiable concepts.
- Mark terms that need classical-vs-modern disambiguation.

## Step 2: Lesson Authoring

- Write step flow: concept, method, pitfalls, takeaway.
- Add explicit common-mistakes section when topic has known confusion patterns.
- Ensure examples support process literacy, not slogan memorization.

## Step 3: Assessment Authoring

- Build question mix with a target lookup cap (default <= one-third).
- Include at least one reasoning-sequence question for process-heavy lessons.
- Require explanation text for every item.

## Step 4: QA Gate

- Run the editorial QA checklist.
- Resolve wording, safety, and consistency issues.
- Confirm title and progression position are correct.

## Step 5: Technical Validation

- Run validation script.
- Run lesson balance audit when required.
- Run mock-to-runtime sync in dry-run, then live mode.

## Step 6: Verification and Handoff

- Verify runtime DB lesson and question counts.
- Capture audit output and sync command history.
- Add changelog entry with impacted lesson IDs and rationale.
