# Aurora Glass Observatory and Assessment Expansion Epic Handoff

## Purpose

This investigation consolidates the decisions, requirements, risks, and current-state evidence needed to create implementation epics for:

1. A clearly visible Aurora Glass Observatory redesign across the complete IQ-ME experience.
2. Correct, readable question and answer rendering.
3. Broader and more credible assessment variants, including mixed ICAR-MR and ICAR-LN assessments.
4. A large, genuinely diverse question bank.
5. Removal of assessment-duration estimates while preserving explicit no-time-limit messaging.

The recommended approach is to create two separate epics. The visual redesign and answer-rendering correction can be implemented and verified independently. The assessment-content expansion requires additional scientific, licensing, calibration, and quality controls and should not be treated as a normal UI feature.

## Decision Summary

### Recommended Epic 14: Aurora Glass Observatory Visual Redesign and Assessment Rendering Correctness

Implement the visual direction shown in:

`_bmad-output/implementation-artifacts/investigations/epic-13-redesign-concepts/01-aurora-glass-observatory.png`

Apply it across:

- Homepage
- Methodology and test-selection pages
- Consent flow
- Assessment/test pages
- Result and saved-result pages
- Shared navigation and chrome
- Downloaded and printed result PDF

The assessment route must remain calmer and less visually decorative than landing and result surfaces. The redesign must also correct the mismatch between the visual scale of questions and answer options.

### Recommended Epic 15: Diverse and Credible Extended Assessments

Expand and refactor the assessment system to provide:

- ICAR-MR assessments
- ICAR-LN assessments
- Mixed ICAR-MR and ICAR-LN assessments
- Full assessments containing more than 48 questions
- A target bank of more than 1,500 genuinely unique questions

This epic must explicitly address scientific validity, item provenance, licensing, calibration, duplication, difficulty, and answer correctness.

## Confirmed Current-State Findings

### Epic 13 Has Code Changes but an Insufficient Visible Delta

The Epic 13 implementation appears to be served correctly, but the redesign can look almost unchanged because:

- Dark glass surfaces use colors very close to the flat page background.
- Translucency and blur are difficult to perceive over a visually uniform backdrop.
- Similar surfaces have weak separation and hierarchy.
- Existing tests primarily prove token and CSS structure, not whether users can see a meaningful redesign.

Relevant investigation:

`_bmad-output/implementation-artifacts/investigations/epic-13-no-visible-changes-investigation.md`

### Aurora Glass Observatory Is the Selected Direction

The selected concept uses:

- A deep-navy spatial backdrop
- Luminous blue-violet aurora gradients
- Legible frosted-glass panels
- Thin glowing scientific grids
- Controlled depth and luminous accents
- Scientific typography
- Clear background-to-surface contrast

Its primary strength is that glass, blur, and depth become unmistakably visible, creating a dramatic homepage and result experience while maintaining continuity with the original Epic 13 glass direction.

Primary risks:

- Excessive glow, animation, or visual noise
- Insufficient text and control contrast over gradients
- Performance cost from blur, gradients, and motion
- Overly complex mobile layouts
- Distracting users during the assessment
- Failing to provide a restrained reduced-motion presentation

### Existing Assessment Rendering Requirement Is Not Sufficiently Met

Epic 11 already included a requirement to normalize answer-option inner icons and keep them consistent with the matrix grid. The current user experience still presents a correctness and usability problem:

- The scale of answer options does not match the scale of the question.
- Geometry can appear incompatible between the question and possible answers.
- It can be difficult to identify or select the intended correct answer.

This must be treated as an assessment-correctness issue, not merely a decorative redesign issue.

### Current Assessment Pools Are Small and Illustrative

The current methodology registry supports:

- Geometric short: 16 questions
- Geometric full: 24 questions
- Letter-number short: 12 questions
- Letter-number full: 20 questions

There is currently no mixed ICAR-MR and ICAR-LN variant.

The current full pools are explicitly illustrative or stub content:

- `src/items/item-parameters-geometric-full.json` contains 24 items and reuses stub SVG assets while calibrated ICAR items remain pending.
- `src/items/item-parameters-letter-number-full.json` contains 20 illustrative stub items.

The existing deterministic item-selection implementation can select unique pool indices within a session and supports a pool larger than the session size. It does not by itself guarantee semantic uniqueness, quality, balanced difficulty, or avoidance of near-duplicates.

## Epic 14 Candidate Requirements

### Product Outcome

Users must immediately perceive a meaningful redesign while retaining the product's private and scientific character. The homepage and results may be dramatic, while the assessment route must use a restrained variant that protects concentration. Questions and answer choices must render at compatible visual scales so the intended answer can be evaluated fairly.

### Visual System

- Create a deep-navy spatial backdrop with controlled blue-violet aurora gradients.
- Use legible frosted-glass surfaces with clear edge definition.
- Use thin luminous grids and blue-violet accents deliberately for scientific context, focus, state, and hierarchy.
- Preserve strong contrast and readable typography.
- Establish clear surface hierarchy between page background, primary content, supporting panels, and controls.
- Avoid translucent same-color surfaces placed over a flat same-color background.
- Avoid excessive blur, glow, shadow, grid density, and decorative motion.
- Use a visually restrained Aurora variant on assessment routes to protect concentration and avoid gamification.
- Keep aurora effects lightweight and progressively simplify them on smaller or lower-powered devices.
- Respect reduced-motion preferences.

### Surface Coverage

- Redesign the homepage and main calls to action.
- Redesign methodology and assessment-selection surfaces.
- Apply the shared Aurora Glass Observatory design to the complete `/methodology/v0.1.0` route and all of its content sections, not only the methodology selector.
- Redesign consent and supporting information surfaces.
- Redesign assessment questions, progress, navigation, and answer options.
- Redesign result and saved-result surfaces.
- Preserve co-equal presentation of Percentile, IQ-scale equivalent, and Range.
- Translate the system into an ink-economical print/PDF design rather than printing a screenshot of glass UI.
- Apply the shared system consistently to navigation, language selection, dialogs, and remaining product surfaces.

### Assessment Rendering Correctness

- Render question content and answer choices at a consistent and comparable visual scale.
- Preserve source geometry, aspect ratios, line weight, spacing, and alignment.
- Ensure answer options are large enough to inspect clearly.
- Ensure selected, focused, hovered, disabled, and unselected states are clearly distinct.
- Ensure keyboard selection is reliable and visible.
- Prevent mobile layouts from shrinking, clipping, or distorting answer content.
- Ensure responsive reflow does not change the meaning of visual questions.
- Validate that the displayed correct answer remains visually equivalent to its intended source form.

### No-Timer Policy

The product has no assessment timer. Do not implement elements from the concept image that resemble:

- A timer
- A countdown
- Elapsed-time display
- Speed scoring
- Time-pressure messaging
- Time-based gamification

Where timing is mentioned to users, only communicate that the assessment is self-paced, has no time limit, or has no time pressure.

### Accessibility and Technical Constraints

- Meet WCAG 2.2 AA contrast and interaction requirements.
- Support complete keyboard operation.
- Preserve visible focus.
- Respect reduced-motion settings.
- Preserve local-only operation and zero third-party runtime dependencies.
- Preserve deterministic and byte-stable production builds.

### Verification Strategy

Structural CSS tests are insufficient for this epic. Verification must include:

- Rendered screenshots at representative desktop and mobile widths.
- Visual-regression review for every major route.
- Browser-rendered tests comparing question and answer scale.
- Browser-rendered tests for clipping, distortion, and responsive behavior.
- Keyboard and focus-state tests.
- Reduced-motion tests.
- Print/PDF rendering review.
- Contrast checks for text, controls, focus, and selected answers.

## Epic 15 Candidate Requirements

### Product Outcome

Users must receive meaningfully different, challenging, and credible assessment experiences instead of small collections of repetitive, easy, or cosmetically varied questions.

### Assessment Variants

- Preserve dedicated ICAR-MR assessment variants.
- Preserve dedicated ICAR-LN assessment variants.
- Add a mixed ICAR-MR and ICAR-LN assessment variant.
- Ensure every full assessment contains more than 48 questions.
- Make short and full assessments meaningfully different in composition and depth.
- For mixed assessments, report MR, LN, and combined performance separately.

### Question-Bank Target

- Build a bank containing more than 1,500 genuinely unique questions.
- Do not count cosmetic transformations as unique questions.
- Do not use exact duplicates.
- Detect and reject near-duplicates.
- Avoid presenting the same underlying puzzle more than once in a session.
- Minimize repetition across saved sessions while preserving privacy and local-only operation.

### Content Diversity

The bank must include broad diversity across:

- Rule families
- Rule combinations
- Number of reasoning steps
- Difficulty levels
- Visual and symbolic layouts
- Distractor strategies
- Answer positions
- Surface presentation without changing underlying validity

ICAR-MR and ICAR-LN must remain recognizably different reasoning experiences. New items must be creative, non-trivial, and not simple restatements of the same pattern.

### Item Correctness and Quality

- Every question must have exactly one defensible correct answer.
- Distractors must be plausible but unambiguously incorrect.
- Item metadata must identify rule family, difficulty target, provenance, answer, and review state.
- Automated checks must verify answer correctness where mechanically possible.
- Automated checks must detect exact duplicates and semantic or structural near-duplicates.
- Automated checks must validate difficulty and rule-family distribution.
- Human review must confirm clarity, uniqueness, and defensibility.
- Session generation must balance categories and difficulty instead of sampling blindly.

### Scientific and Licensing Constraints

The target of more than 1,500 questions cannot be met solely by treating newly authored content as official ICAR items.

- Keep official ICAR content clearly separate from newly authored items.
- Preserve source, license, attribution, and provenance for every official item.
- Do not label newly authored questions as official ICAR items.
- Do not assume newly authored questions inherit published ICAR calibration parameters.
- Treat new questions and mixed/composite scores as experimental until calibrated and validated.
- Clearly communicate experimental status where scientifically comparable IQ-scale results cannot yet be supported.
- Do not present unsupported precision or comparability.

### Calibration and Validation

Before newly authored or mixed assessments are presented as scientifically comparable scores:

- Establish a calibration plan.
- Collect appropriate response evidence.
- Analyze item difficulty and discrimination.
- Remove ambiguous, trivial, redundant, or poorly performing items.
- Validate score interpretation and mixed-score aggregation.
- Document limitations and confidence.

### Technical Constraints

- Preserve deterministic selection and scoring.
- Preserve local-only data handling.
- Preserve zero third-party runtime behavior.
- Keep item provenance auditable.
- Ensure bank growth does not make production builds unstable or unnecessarily large.
- Define a scalable structured format and generation-validation pipeline rather than manually maintaining thousands of opaque files.

### Verification Strategy

- Exact duplicate detection.
- Near-duplicate and structural-similarity detection.
- Correct-answer validation.
- Distractor uniqueness validation.
- Rule-family distribution checks.
- Difficulty-distribution checks.
- Session-level no-repeat checks.
- Cross-session repeat-minimization checks.
- Mixed-assessment composition and scoring tests.
- Provenance and license-completeness checks.
- Manual item-quality review workflow.
- Calibration-readiness and experimental-label checks.

## Time-Copy Policy

Assessment-duration estimates must be removed from user-facing product and project copy.

Remove language such as:

- "takes about 25 minutes"
- estimated completion durations
- visible countdown or waiting-duration language
- messaging that suggests speed matters

Allowed language:

- "self-paced"
- "no time limit"
- "no time pressure"

Technical performance benchmarks, launch schedules, and methodological discussion of retest timing are outside this policy and may remain where relevant.

The current time-copy cleanup has already been implemented in the working tree across live EN/PL/RU copy, methodology pages, documentation, planning artifacts, evidence, schema, snapshots, and tests. It has not been committed as part of this investigation.

## Provisional Story Decomposition

### Epic 14: Aurora Glass Observatory Visual Redesign and Assessment Rendering Correctness

1. Define Aurora Glass Observatory tokens, backdrop, frosted surfaces, luminous grids, depth, motion, performance, and accessibility rules.
2. Build reusable surface, layout, focus, and interaction primitives.
3. Redesign homepage, methodology selection, the complete `/methodology/v0.1.0` route, and consent flows.
4. Correct assessment question and answer rendering, scaling, and responsive behavior.
5. Redesign assessment route controls and progress without timer-like UI.
6. Redesign results, saved results, and shared chrome.
7. Redesign downloadable and printable result output.
8. Add rendered visual-regression, accessibility, responsive, and print verification.

### Epic 15: Diverse and Credible Extended Assessments

1. Define item taxonomy, provenance model, experimental-status rules, and validation pipeline.
2. Build duplicate, near-duplicate, correctness, and distribution quality gates.
3. Refactor and expand ICAR-MR item architecture and content.
4. Refactor and expand ICAR-LN item architecture and content.
5. Add mixed ICAR-MR and ICAR-LN assessment composition and reporting.
6. Add full assessments containing more than 48 questions.
7. Build the more-than-1,500-item authoring, generation, review, and storage pipeline.
8. Add session balancing, no-repeat, and cross-session repeat-minimization behavior.
9. Establish calibration, validation, and experimental-result communication.

## Decisions Required During Epic Creation

- Whether Epic 14 should replace or formally extend unfinished Epic 13 acceptance criteria.
- Exact visual-regression tooling and approved reference viewport set.
- Quantitative tolerance for question-to-answer visual scale matching.
- Whether the more-than-1,500-item target means approved production items or a mixture of production and experimental candidates.
- Which newly authored item families are permitted under ICAR-adjacent naming.
- How experimental mixed results should be presented before calibration.
- How cross-session repeat minimization should work without server-side user tracking.
- How to maintain translation quality for question text and explanations at the required scale.

## Source and Evidence Map

- Selected visual reference: `_bmad-output/implementation-artifacts/investigations/epic-13-redesign-concepts/01-aurora-glass-observatory.png`
- Concept descriptions: `_bmad-output/implementation-artifacts/investigations/epic-13-redesign-concepts.md`
- Epic 13 visibility investigation: `_bmad-output/implementation-artifacts/investigations/epic-13-no-visible-changes-investigation.md`
- Existing epic planning: `_bmad-output/planning-artifacts/epics.md`
- Existing methodology research: `_bmad-output/planning-artifacts/methodology-landscape-research.md`
- Methodology registry: `src/assessment/methodology-registry.js`
- Deterministic item selection: `src/assessment/item-selection.js`
- Geometric full pool: `src/items/item-parameters-geometric-full.json`
- Letter-number full pool: `src/items/item-parameters-letter-number-full.json`

## Ready-to-Use Epic Creation Prompt

Create two implementation epics from:

`_bmad-output/implementation-artifacts/investigations/aurora-glass-observatory-and-assessment-expansion-epic-handoff.md`

Epic 14 must implement the selected Aurora Glass Observatory concept across all product and print/PDF surfaces, use a restrained presentation on assessment routes, correct question-to-answer visual scale and selection usability, explicitly exclude all timer-like UI, and require rendered visual-regression, contrast, reduced-motion, and performance verification.

Epic 15 must create distinct ICAR-MR, ICAR-LN, and mixed variants; require every full test to contain more than 48 questions; establish a pipeline and quality gates for more than 1,500 genuinely unique questions; and preserve scientific honesty by separating official ICAR items from experimental newly authored content and requiring calibration before scientifically comparable score claims.
