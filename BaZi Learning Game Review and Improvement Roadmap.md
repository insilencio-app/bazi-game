# BaZi Learning Game Review and Improvement Roadmap

**Site reviewed:** [bazi-game-theta.vercel.app](https://bazi-game-theta.vercel.app/)  
**Review scope:** Public landing page, representative lessons (0, 1, 5, and 9), formative-question feedback, and the total-quiz flow.  
**Prepared by:** Manus AI  
**Date:** 13 August 2026

## Executive assessment

The site already has a strong foundation: it is clearly more than a static BaZi reference guide. It presents a structured, game-like curriculum with a visible path from Four Pillars and Five Elements through Ten Gods, hidden stems, earthly-branch relations, chart patterns, application, and a final quiz. The course sequence, compact step-by-step lessons, immediate answer feedback, progress visibility, and emerging gamification system create a credible learning product rather than a collection of articles. [1]

The main opportunity is to make the experience feel **deliberately designed for a first-time learner**. At present, the product has good material and a good shell, but the learning loop is still mostly *read → continue → answer a single multiple-choice question*. The next version should make the learner’s goal explicit, use one consistent content template, place examples before abstraction, make review adaptive, and clearly distinguish historical/traditional interpretation from evidence-based claims about a person’s life. Those changes would improve trust, completion, and learning retention without requiring a wholesale redesign.

> **Bottom line:** retain the compact, game-based structure, but evolve it into a mastery-oriented learning system: *orient → model → guided practice → independent retrieval → targeted review → progress celebration*.

## What is working well

| Strength | Evidence observed | Why it matters |
|---|---|---|
| **Coherent curriculum scope** | The course map progresses from Lesson 0 through Lesson 10, adds focused practice lessons, a total quiz, and a supplemental lineage-specific lesson. [1] | Learners can see a credible path rather than isolated facts. |
| **Sensible conceptual scaffolding** | Lesson 0 introduces the Four Pillars and Day Master before later topics; Lesson 5 explicitly frames the Ten Gods as relationships rather than fixed personality labels. [1] | The sequence reduces premature interpretation and avoids a common beginner misconception. |
| **Useful visual reference interaction** | The Five Elements lesson exposes compact, selectable reference cards for direction, season, emotion, virtue, and mnemonic. [1] | Interactive reference material is appropriate for a high-vocabulary subject. |
| **Immediate formative feedback** | A correct answer produces a direct explanation: first identify the Day Master, then assess the month command. [1] | Feedback after retrieval practice helps learners correct errors before they become habitual. [2] |
| **Clear navigational controls** | Each sampled lesson displays its current step and offers previous, continue, and jump-to-quiz actions. [1] | The interaction model is easy to understand and makes lessons feel finishable. |
| **Early engagement signals** | The dashboard includes levels, XP, badges, streaks, a “continue learning” CTA, and a rapid-review entry point. [1] | These mechanisms can support habit formation once rewards reflect meaningful mastery. |
| **Healthy interpretive restraint in selected lessons** | Lesson 5 cautions against treating Ten Gods as predetermined personality labels, and Lesson 9 distinguishes classical and modern meanings of 用神. [1] | This shows editorial maturity and can become a major trust differentiator. |

## Priority findings and recommendations

### 1. Define the learner promise before the learner sees the course map

The home screen says “Learn BaZi in an Interactive Way,” but it does not yet answer three central beginner questions: **Who is this for? What will I be able to do after the first session? What kind of BaZi does this course teach?** The large course list arrives before orientation, which can make the product seem demanding even though individual lessons are compact.

Add a short first-visit onboarding panel before the dashboard. It should state the target learner, expected commitment, learning outcome, and editorial scope. For example:

> **For curious beginners.** In 10–15 minutes, learn to identify the Four Pillars and your Day Master. This course teaches foundational concepts and selected classical Zi Ping approaches as cultural and interpretive traditions—not as deterministic predictions or a substitute for professional advice.

Use a two-question diagnostic only if it changes the experience, such as “I am new to BaZi / I know the basics” and “I want foundations / I want review.” Otherwise, use one unmistakable button: **Start Lesson 0 — 8 minutes**.

| Priority | Improvement | Implementation definition of done |
|---|---|---|
| P0 | First-visit orientation | A newcomer sees audience, scope, time estimate, first learning outcome, and a single primary CTA before the curriculum map. |
| P0 | Editorial and safety framing | A short “How this course approaches BaZi” panel distinguishes tradition, interpretation, and personal decision-making. |
| P1 | Course-map clarity | Group lessons into 3–4 named modules, show prerequisites and estimated time, and keep only the recommended next lesson expanded by default. |

### 2. Turn each lesson into a repeatable learning arc, not a sequence of slides

The sampled lessons contain concise and often clear explanations, but their teaching rhythm is uneven. Lesson 0 uses an illustrative Four-Pillars diagram; Lesson 1 offers an interactive reference set; Lesson 5 includes optional audio; Lesson 9 becomes text-dense and invokes classical rules without a worked chart. Consistency will reduce cognitive load and improve production efficiency.

Adopt one reusable lesson template. Each lesson should begin with a learner-visible objective, introduce only the minimum vocabulary needed, model the idea using one annotated example, ask for a small decision with a hint, then end with independent retrieval and a practical recap. Breaking complex topics into manageable parts and supplying temporary supports are established approaches to instructional scaffolding. [3] Working memory is limited, so dense terminology should be sequenced and supported rather than presented as a list of rules. [4]

| Lesson element | Recommended pattern | Example for Lesson 0 |
|---|---|---|
| **Outcome** | “After this lesson, you can…” | “Identify the four pillars and locate the Day Master in a chart.” |
| **Core model** | One idea, one visual | A color-coded sample chart with labels for year, month, day, and hour. |
| **Guided practice** | A partially completed task | “The day pillar is 甲子. Which character is the Day Master?” |
| **Independent check** | 2–3 questions of varied format | Identify, explain why, then apply to a different chart. |
| **Recap** | Three short “remember this” statements | “Day-stem = Day Master; month branch = seasonal command; interpret relations after the foundation.” |
| **Next-step bridge** | Explain why the next lesson follows | “Next, learn Five Elements—the vocabulary used to describe those relations.” |

The most important content change is to add **worked examples**. In a subject built on relationships and transformations, a rule alone is not enough. For every advanced claim, show one fully annotated miniature chart, narrate the decision sequence, and then offer a nearly identical chart with one changed variable. This makes the progression from terminology to reasoning visible.

### 3. Redesign assessment around mastery and retrieval—not just answer checking

The current multiple-choice check is clean and the feedback is concise. That is a good starting point. However, the total quiz presented a Lesson 7 question (“卯戌合成什麼五行?”) to a new learner whose visible progress was essentially at the start of Lesson 0. [1] This creates a mismatch between the promise of a “quick quiz” and the learner’s actual readiness.

Retrieval practice is valuable, particularly when paired with feedback, but questions should be appropriately challenging and aligned to what the learner has studied. [2] Replace the single global quick quiz with an adaptive **Review Queue** that draws first from completed lessons, then from due review items, and only then from optionally selected future topics.

| Priority | Assessment improvement | Specific build approach |
|---|---|---|
| P0 | Gate review by mastery | Attach `lessonId`, `conceptId`, difficulty, and prerequisite fields to every question. Default review only includes unlocked concepts. |
| P0 | Use explanations for every answer | For correct and incorrect choices, explain *why that answer follows* and why the strongest distractor is wrong. Link back to the relevant lesson step. |
| P1 | Add question formats | Mix recognition, ordering, matching, “find the Day Master,” and short explanation prompts. Use multiple-choice only where recognition is the intended skill. |
| P1 | Add spaced review | Schedule items after learning and after increasing intervals; reintroduce errors sooner than mastered items. |
| P1 | Show mastery honestly | Report concept mastery as “learning / practicing / solid” rather than only total accuracy. |

The product should also distinguish **practice mode** from **assessment mode**. In practice, hints should be freely available or inexpensive, explanations should be prominent, and retries should teach. In assessment, learners can choose a more limited-hint challenge. A new learner currently has 0 XP while the hint costs 50 XP, so the first useful hint is unavailable exactly when support is most needed. [1]

### 4. Make the source model and interpretive boundaries explicit

The advanced curriculum has a promising strength: it recognizes that terms such as 用神 have classical and later interpretations. That nuance deserves a more visible editorial system. Lesson 9 refers to 《子平真詮》 and describes a particular classical approach, but the sampled screen does not yet show a source excerpt, edition/reference, or a clear “school/tradition” label. [1]

Create a compact source drawer at the end of every advanced lesson:

| Source field | Purpose |
|---|---|
| **Tradition / lens** | Labels the approach, such as “Zi Ping classical framework” or “modern popular usage.” |
| **Primary or secondary source** | Provides book title, author/editor where known, edition/translation details, and a stable bibliography entry. |
| **What this lesson teaches** | States the operational rule used by the game. |
| **Where traditions differ** | Notes that other lineages may prioritize a different rule or interpretation. |
| **Scope note** | States that the lesson is educational and interpretive, not a reliable method for predicting health, finance, legal outcomes, or life events. |

This is not merely a disclaimer. It lets the product win on intellectual honesty: learners can understand *which framework* they are practicing instead of mistaking one rule set for a universal fact.

### 5. Make gamification reinforce learning rather than compete with it

Levels, XP, badges, and streaks are visible immediately. The interface currently risks showing rewards before a learner knows why the first lesson matters. In my test session, Lesson 0’s lesson-level score showed 1/1, while the dashboard’s aggregate “correct answers” remained 0 and XP remained 0. [1] This may be an instrumentation or state-update issue, but if it is reproduced, it will weaken trust in the game loop.

Start simple: award XP for meaningful actions, display the reason for each reward, and reserve badges for observable learning milestones. Avoid incentives that reward merely clicking through content.

| Reward | Recommended trigger | Avoid |
|---|---|---|
| XP | Completing a lesson recap, first-attempt correct application, or clearing due review items | Rewarding every “continue” click. |
| Badge | “Identified 10 Day Masters correctly across varied charts” | Vague badges with no stated criterion. |
| Streak | Completing a 3–5 minute review on separate days | Punishing learners harshly for a missed day. |
| Hint currency | Small, learnable cost after a free first hint | Requiring XP before a learner has any legitimate way to earn it. |

### 6. Tighten language, terminology, and content density

The Chinese-first interface is appropriate for the current audience, but English subtitles appear in the site title and lessons. Decide whether they are an aid for bilingual learners or a branding artifact. If the primary user is a Traditional Chinese reader, use English sparingly and consistently; if the product is bilingual, introduce a real language preference and translate instructions, feedback, tooltips, and source notes throughout.

Also refine a few high-level formulations. For example, Five Elements should be introduced as a traditional symbolic/correlative framework rather than straightforwardly as “five basic elements in nature.” That keeps the educational tone accurate and prevents users from reading the material as a scientific taxonomy. Place potentially sensitive associations (emotion, personality, relationships, life outcomes) after a clear note that associations are interpretive, context-dependent, and not diagnostic.

### 7. Add accessibility and usability quality gates before scaling the curriculum

The visual style is friendly, with a strong blue header, card-based content, obvious buttons, and helpful progress indicators. Before producing more lessons, establish a lightweight interface checklist. In particular, check mobile readability, keyboard-only navigation, focus visibility, text alternatives for graphics, contrast in selected/unselected answer states, target sizes, and whether audio has transcripts. Do not assume these are failing; they were not fully testable in this review. Treat them as release criteria.

## Suggested implementation roadmap

### Phase 1 — Establish the learning and measurement foundation (Week 1)

Define one primary learner persona—for example, a Traditional Chinese-speaking curious beginner with no prior ability to read a chart—and write the top three outcomes for the first 30 minutes, first week, and end of the core path. Audit all lessons against a shared spreadsheet or CMS schema: objective, prerequisite, key terms, rule, worked example, practice item, source/lens, caution note, and next concept.

At the same time, instrument the learner funnel: `first_visit`, `onboarding_complete`, `lesson_started`, `step_viewed`, `question_answered`, `hint_opened`, `lesson_completed`, `review_completed`, and `returning_session`. Reproduce and resolve the visible score/XP inconsistency before expanding rewards.

| Output | Acceptance criterion |
|---|---|
| Learner and editorial brief | One-page decision document defining audience, course promise, interpretation scope, and language policy. |
| Content schema | Every existing lesson is mapped to objectives, concepts, prerequisites, sources, and practice. |
| Measurement plan | Event names, properties, dashboard definitions, and privacy notice are documented. |
| Data-quality fixes | Lesson results, cumulative correctness, XP, badges, and “next lesson” state agree after refresh and return visits. |

### Phase 2 — Redesign the first-session experience (Weeks 2–3)

Build only the highest-leverage learning slice: onboarding, Lesson 0, Lesson 1, and the review queue. Add time estimates, “after this lesson you can…” statements, one annotated chart per lesson, two guided exercises, multiple independent checks, rich feedback, free first hints, and a short wrap-up. Convert “quick quiz” to “Today’s review,” which defaults to concepts the learner has encountered.

Create one reusable visual language for concept relationships: consistent colors/icons for the five elements, a permanent legend, and diagram conventions for generation/control relationships. Add a source/lens drawer to Lesson 9 as the pilot for advanced content transparency.

### Phase 3 — Validate with real users, then refine (Weeks 4–5)

Conduct five to seven moderated usability sessions with target beginners. Ask participants to begin from the landing page, explain what they think the product is for, complete Lesson 0, use a hint, and return to the dashboard. Record where they hesitate, which terminology they cannot restate, whether the first review feels fair, and whether the rewards make sense.

Use the event data and sessions to improve one issue at a time. The first target is not “more content”; it is a reliable first-session loop in which a learner understands the promise, completes a lesson, can explain the Day Master, gets relevant review, and sees credible progress.

### Phase 4 — Scale content and adaptive practice (Weeks 6–9)

After the Lesson 0–1 prototype is validated, migrate Lessons 2–10 into the standardized template. Prioritize concepts that learners miss often. Add question metadata, per-concept mastery, spaced review, source panels for advanced interpretations, audio transcripts, and glossary linking. Convert special practice lessons 5.5 and 6.5 into targeted remediation nodes that appear automatically when their prerequisite concept is weak.

### Phase 5 — Optimize retention and trust (Ongoing)

Review learning analytics every two weeks. Compare drop-off by lesson, question accuracy by concept, hint use, time on step, and return behavior. Refresh items with high confusion but weak explanations. Expand badges only when they represent meaningful evidence of mastery. Maintain a visible editorial changelog for source or rule revisions.

## Success metrics

Set a baseline first, then choose targets. The following metrics will tell you whether the redesign is actually helping:

| Area | Metric | Decision use |
|---|---|---|
| Activation | Share of first-time visitors who start Lesson 0 and finish it | Validates orientation and first-lesson friction. |
| Learning | First-attempt accuracy and delayed-review accuracy by concept | Separates short-term guessing from retention. |
| Comprehension | Share of learners who can correctly identify the Day Master on a novel chart | Tests the stated outcome of Lesson 0. |
| Fairness | Accuracy and abandonment rate in Today’s Review | Detects whether questions are aligned to unlocked content. |
| Engagement | Return rate after 1 day and 7 days; voluntary review completions | Measures habit formation without overemphasizing raw clicks. |
| Trust | Source-drawer opens, feedback mentions, and post-session confidence comments | Measures whether nuance and transparency are helping. |
| Quality | Mismatch rate between lesson score, XP, and dashboard totals | Protects confidence in the game system. |

## Recommended order of work

1. **Fix progress-state integrity** and make the first hint accessible.
2. **Replace the global quick quiz with an adaptive review queue** tied to completed content.
3. **Rebuild Lessons 0 and 1 using a shared lesson template** with objectives, annotated examples, guided practice, and independent checks.
4. **Add source/lens and scope notes**, starting with advanced lessons that invoke classical rules or contested terminology.
5. **Run beginner usability tests and instrument the funnel** before scaling content production.
6. **Migrate the remaining curriculum** once the new learning loop has demonstrated stronger activation and retention.

## References

[1]: https://bazi-game-theta.vercel.app/ "輕鬆學八字 — BaZi Learning Game (reviewed 13 August 2026)"
[2]: https://ctl.wustl.edu/resources/using-retrieval-practice-to-increase-student-learning/ "Washington University in St. Louis — Using Retrieval Practice to Increase Student Learning"
[3]: https://www.niu.edu/citl/resources/guides/instructional-guide/instructional-scaffolding-to-improve-learning.shtml "Northern Illinois University — Instructional Scaffolding to Improve Learning"
[4]: https://link.springer.com/article/10.1007/s11251-009-9110-0 "de Jong (2010) — Cognitive load theory, educational research, and instructional design"

---

**Final recommendation:** The product is ready for a focused **learning-experience refinement**, not a content explosion. Build a superior first hour first; then scale the content with a source-aware, example-led, adaptive practice system.
