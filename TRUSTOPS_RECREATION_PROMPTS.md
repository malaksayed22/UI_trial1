# TrustOps AI website recreation prompts

This document is a complete prompt pack for recreating the supplied TrustOps AI website. Use the master prompt for a one-shot build, then use the page prompts as refinement prompts if a coding model needs to work page by page. Preserve the wording, data, navigation, responsive layouts, interaction states, and motion described below.

## One-shot master prompt

```text
Build a pixel-faithful, responsive recreation of “TrustOps AI — Signal Room,” a dark enterprise observability and governance product for generative and agentic AI. The finished product must include the public landing experience and every console route listed below. Do not simplify the information architecture, merge screens, omit lower-page panels, or replace meaningful visuals with generic placeholders.

TECH STACK
- React 19 + TypeScript + Vite.
- Tailwind CSS for layout and utilities, with a custom CSS layer for the visual system and bespoke diagrams.
- Framer Motion for page transitions, entrances, card hover/tap motion, and expandable content.
- Lucide React for interface icons.
- Use client-side routing. Required URLs: /, /overview, /applications, /traces, /detail, /rag, /rca, /gate, and /health.
- The site is a frontend demo with realistic local mock data; no backend is required.

PRODUCT IDEA
TrustOps makes hidden AI execution behavior visible and defensible. It captures traces, ranks evidence, identifies root causes, and produces PASS, REVIEW, or BLOCK release decisions. The experience has two modes:
1. A cinematic public landing page at /.
2. A compact operational console for all other routes.

GLOBAL VISUAL SYSTEM
- Dark-only interface. Main console background #070d16; landing background approximately #080c13. Use slightly lighter navy panels such as #0a1420 and #111f2f.
- Primary typeface: Space Grotesk, weights 400–700. Monospace labels: DM Mono, weights 400–500.
- Main text is cool white/slate. Secondary copy is muted blue-gray. The interface must feel technical, quiet, premium, and precise—not neon cyberpunk.
- Accent system: blue for navigation and trace/retrieval signals, emerald/mint for PASS and healthy state, amber for REVIEW/warnings, rose for BLOCK/errors, violet for models and evidence.
- Use thin low-opacity white borders, 8–16px corner radii, faint blue glows, restrained gradients, grain/noise overlays, and subtle grid textures.
- Status pills are compact rounded capsules with a colored border/background and a leading dot: “✓ PASS” in emerald, “▲ REVIEW” in amber, and “× BLOCK” in rose. PASS may have a subtle pulsing dot.
- Cards and panels use a navy diagonal gradient, 1px translucent border, soft black shadow, and a restrained light sweep on hover.
- Use small uppercase, letter-spaced monospace eyebrows and metadata. Numeric metrics use tight negative letter spacing.
- Avoid stock photography and large decorative illustrations. Build all graphics from CSS, HTML, SVG paths, icons, charts, timelines, cards, and data.

SHARED CONSOLE SHELL FOR /overview THROUGH /health
- Fixed 232px left sidebar on desktop, dark translucent navy with a right border and backdrop blur.
- Brand at the top: a small rounded blue gradient square mark with a dark center dot, “TrustOps AI,” and “SIGNAL ROOM / v0.9.” Clicking it opens /overview.
- Sidebar section label: “RELIABILITY CONSOLE.”
- Seven numbered navigation items with Lucide icons and two-digit suffixes:
  01 Overview → /overview
  02 Applications → /applications
  03 Trace Explorer → /traces
  04 Trace Detail → /detail
  05 RAG Diagnostics → /rag
  06 Failure & RCA → /rca
  07 Release Gate → /gate
- The active item has a blue-tinted gradient background, blue left inset line, brighter text, and thin blue border.
- Sidebar bottom contains a clickable “SYSTEM VITALS / Pipeline health” card leading to /health. Show LIVE, 92%, “healthy signal,” “+4.8% vs last run,” ten short colored stage segments, “10 stages monitored,” and “VIEW STORY →.”
- Beneath it, show user profile: circular initials “PK,” “Priya K.,” “REVIEWER / ADMIN,” and a settings icon.
- Sticky top header, 68px high, with “TRUSTOPS > RELIABILITY CONSOLE” on the left. On the right show a “Jump to trace” command control with ⌘ K, a bell with a blue unread dot, a separator, and a green-dot “production” environment pill.
- Main console content begins to the right of the sidebar and uses a maximum width around 1480px with 32px desktop gutters.
- Every page enters with a 0.32-second fade, 16px upward motion, and brief blur resolving to sharp. Exit with a smaller upward fade.
- On widths below 1024px, hide the sidebar off-canvas and show a hamburger in the header. Opening it slides the sidebar in; include a close icon. Keep the top header sticky.
- On mobile, stack grids to one column, preserve 20px gutters, and make wide tables horizontally scrollable.

SHARED PAGE COMPONENTS
- Page heading: thin blue dash + uppercase eyebrow, a 36px Space Grotesk title, muted 12px description, and optional right-aligned action.
- Reusable Panel: 12px radius, subtle navy gradient, low-opacity white border, 18px padding; optional blue glow.
- Panel title: 14px title, 10px subtitle, optional right-side action.
- Reusable metric card, status pill, version chip, field, segmented control, primary button, ghost button, filter button, and page button.
- Provide visible hover, focus, active, and disabled states. Keep keyboard navigation and readable contrast.

ROUTES AND CONTENT
- / is the complete cinematic landing page described in the Landing page prompt below.
- /overview is the Reliability Overview dashboard.
- /applications is the application inventory.
- /traces is the searchable Trace Explorer.
- /detail is an ordered trace timeline and execution graph.
- /rag is RAG evidence and citation diagnostics.
- /rca is failure classification and root-cause analysis.
- /gate is the release quality gate comparison.
- /health is an animated reliability pipeline story.

MOTION AND RESPONSIVE RULES
- Desktop landing scenes behave like a deck of sticky full-viewport slides. As the user scrolls, later scenes cover earlier ones. Show a sticky scene progress indicator in the navigation.
- At widths below 900px, convert landing scenes to normal document flow, single-column layouts, and content sections at least one viewport tall. In the hero, place the trace console preview before the headline.
- At widths below 600px, use 20px horizontal gutters, hide landing navigation links, reduce the top CTA to an icon-only control, stack all signal cards, hide the hero console’s right-side gauge, and use approximately 50px hero type.
- Use subtle chart drawing, pulse, glow, card lift, and live-dot animation. Respect prefers-reduced-motion by disabling loops and sticky scene effects.

QUALITY BAR
- Match all copy and demo data from the detailed prompts.
- Do not use empty chart boxes, lorem ipsum, generic admin-template styling, or invented pages.
- Ensure every internal CTA and sidebar item navigates correctly.
- Implement the trace search as a working client-side filter.
- The health story must automatically advance through four stages and allow stage expansion.
- The final result must work at 1440px desktop, 1024px tablet, 768px narrow tablet, and 390px mobile without clipping or unreadable text.
```

## Landing page prompt

```text
Create the public TrustOps AI landing page at /. It must feel like a five-scene cinematic product story, not a conventional marketing template. Use full-bleed dark surfaces, sticky viewport scenes on desktop, progressive blue/violet/mint lighting, and precise technical typography.

STICKY NAVIGATION
- Full-width sticky nav with centered 1240px content gutters.
- Left: TrustOps AI brand mark and “SIGNAL ROOM / v0.9.”
- Center-left links: System, Workflow, Research, anchored to the related sections.
- Center scene progress: “01 — VISIBLE / 05,” changing by scene to EVIDENCE, DECISION, DEFENSE, and TRUST. Update it according to the most recently entered scene.
- Right: outlined “Enter Signal Room →” button opening /overview.

SCENE 1 — HERO / VISIBLE
- Two-column desktop composition: editorial copy left, large live trace-console mockup right.
- Eyebrow with green live dot: “TRACE-BASED RELIABILITY / FOR AI THAT ACTUALLY ACTS.”
- H1 across deliberate line breaks: “Make AI behavior visible. Then make it trustworthy.” Color “visible.” with the blue-violet-mint gradient; render “trustworthy.” in muted steel-blue.
- Supporting copy: “TrustOps turns the hidden execution path of generative and agentic AI into evidence your team can inspect, evaluate, and defend.”
- Primary CTA: “Explore the Signal Room ↗” → /overview. Secondary CTA: “See how it works →” → #workflow.
- Proof row: 3,038 traces evaluated; 86.4% reliability score; 7 investigation screens.
- Console mockup title bar: three window dots, “signal-room / live-trace / 8f21c9a4,” green LIVE.
- Console case: eyebrow “ACTIVE INVESTIGATION / PROCUREMENT AGENT,” title “Approval-bypass attempt,” BLOCK pill, metadata “app-v2.4.1,” “7 ordered events,” “1.3s duration.”
- Timeline cards: RETRIEVAL / POL-114 / score 0.94 / ✓; MODEL CALL / Plan drafted / 312 tokens · 866ms / ✓; AGENT STATE / PRE_APPROVAL / approval_received = false / !; POLICY ENGINE / Action blocked / approval_required_before_po / ×.
- Right-side gauge: “DECISION SIGNAL,” 0.93 confidence, BLOCK, critical finding.
- Console footer: “trace integrity verified” and “evidence graph synced · 2s ago.” Caption: “TRUSTOPS TRACE VIEW” and “01 / 07 SCREENS.”
- Beneath the hero, add a narrow horizontal process marquee: AI APPLICATION → EXECUTION TRACE → EVALUATORS → ROOT CAUSE → PASS / REVIEW / BLOCK → AI APPLICATION.

SCENE 2 — SYSTEM / EVIDENCE
- Anchor id system. Eyebrow “THE RELIABILITY LAYER.”
- Heading: “AI is only as trustworthy as its evidence.” Apply the gradient to “evidence.”
- Copy: “Final answers are not enough. TrustOps reconstructs the path behind every response, tool call, retrieval, and policy decision.”
- Three large interactive cards. Default selected card is Evidence; selecting or hovering a card adds a brighter border and lift.
  1. 01 / TRACE. Large 01. Stat: 7 ordered events. Copy: “Capture the full execution path, from the first retrieval to the final response.” Detail: trace-8f21c9a4. Tags: RETRIEVAL, MODEL, TOOL CALL. Blue accent.
  2. 02 / EVIDENCE. Large 02. Stat: 0.94 top evidence score. Copy: “Make every decision explainable with ranked documents, policy rules, and evaluator signals.” Detail: POL-114 · rank #1. Tags: CITATIONS, GROUNDING, RCA. Violet accent.
  3. 03 / TRUST. Large 03. Stat: 86.4% reliability score. Copy: “Ship only what can be defended with repeatable gates and an auditable decision trail.” Detail: candidate / baseline. Tags: PASS, REVIEW, BLOCK. Mint accent.

SCENE 3 — WORKFLOW / DECISION
- Anchor id workflow. Use a two-column layout with a large tilted trace window on the left and copy on the right.
- Window URL bar: “trace://trustops/8f21c9a4.” Title “Approval-bypass attempt” plus BLOCK pill.
- Four ordered rows with colored indices and chevrons: 01 RETRIEVAL / POL-114 / score 0.94; 02 AGENT STATE / PRE_APPROVAL; 03 TOOL CALL / create_purchase_order; 04 POLICY ENGINE / BLOCKED · critical.
- Eyebrow: “FROM SIGNAL TO DECISION.”
- Heading: “See the moment reliability breaks.” Apply the gradient to “breaks.”
- Copy: “From a retrieved policy to a proposed tool call, every meaningful event becomes part of an ordered, reviewable story.”
- CTA: “Open a trace investigation ↗” → /detail.

SCENE 4 — RESEARCH / DEFENSE
- Anchor id research.
- Eyebrow: “BUILT FOR THE DEFENSE.”
- Heading: “Operational clarity. Academic rigor.” Apply gradient to “Academic rigor.”
- Copy: “Designed around falsifiable experiments, interpretable baselines, and a reviewer journey that can be demonstrated end-to-end.”
- Four equal statistic cells separated by fine borders: 8 failure classes; Top-3 root-cause ranking; CI/CD quality gate; 2 reference applications.

SCENE 5 — TRUST / FINAL CTA
- Centered full-viewport closing scene with a quiet radial blue glow.
- Eyebrow: “DEFEND THE SYSTEM.”
- Heading: “Make every decision worth trusting.” Apply gradient to “worth trusting.”
- Copy: “TrustOps gives teams the evidence, trace, and academic rigor to understand what AI did — and defend what it should do next.”
- Gradient CTA: “Enter the Signal Room ↗” → /overview.

FOOTER
- Brand with subtitle “TRACE-BASED RELIABILITY.”
- Note: “A graduation project in reliability, evaluation & governance for generative and agentic AI.”
- Version note: “TRUSTOPS AI / SIGNAL ROOM / v0.9.”

LANDING MOTION
- Animate hero copy and console in on load.
- Console has a very subtle breathing glow; event rows settle/pulse at staggered delays.
- Cards lift around 7px on hover. The workflow window lifts when its scene is active/hovered. Research statistics reveal upward.
- On desktop each scene is 100svh with a minimum around 680px and sticks at the top. On mobile remove sticky positioning and use natural vertical flow.
```

## Reliability Overview page prompt

```text
Create /overview inside the shared console shell.

Heading: eyebrow “SIGNAL ROOM / OVERVIEW,” title “Reliability Overview,” description “Where reliability is deteriorating, right now, across both reference applications.” Add a segmented 14d / 30d / 90d control with 14d active.

Top metrics, four responsive cards:
1. Traces evaluated — 3,038 — trend +12.4% — “LAST 30 DAYS / +12.4% VS PRIOR” — blue activity icon.
2. Reliability score — 86.4% — trend +4.8% — “WEIGHTED ACROSS BOTH APPS” — emerald gauge icon.
3. Needs investigation — 218 — trend -8.1% — “7.2% OF ALL TRACES” — amber search/file icon.
4. Blocked actions — 64 — trend -16.3% — “POLICY / SECURITY ENFORCEMENT” — rose lock icon.

Second row:
- Wide “Reliability trend” panel with subtitle “Decision volume per day · last 14 days,” PASS/REVIEW/BLOCK legend, large 86.4%, +4.8% vs previous period, and a dark grid chart with rising emerald PASS line, flatter amber REVIEW line, and low rose BLOCK line. Bottom dates: SEP 08, SEP 11, SEP 15, SEP 21.
- “Top failure classes” panel with “View all →” to /traces. Ranked horizontal bars: Unsupported claim 142 / 72%; Retrieval failure 98 / 53%; Policy bypass attempt 76 / 41%; Tool argument malformed 61 / 32%; Workflow stage skipped 54 / 28%; Weak grounding 47 / 24%.

Third row:
- Wide “Application pulse” panel, subtitle “Latest evaluated configuration,” “open inventory” link to /applications. Two cards:
  Procurement Agent, app-v2.4.1, PASS, 1,842 traces / 30d, 78% pass, progress 92%.
  Enterprise RAG Assistant, app-v1.9.0, REVIEW, 1,196 traces / 30d, 64% pass, progress 79%.
- “Recent release gates” panel with link to /gate and four rows: retriever-v2.4.0 BLOCK 2h ago; agent-v2.4.1 PASS 1d ago; prompt-v1.9.0 REVIEW 3d ago; model-v1.8.2 PASS 5d ago.

Cards lift subtly on hover. Preserve the full lower rows; do not stop after the metric cards and chart.
```

## Applications page prompt

```text
Create /applications inside the shared console shell.

Heading: eyebrow “INVENTORY / CONFIGURATION,” title “Applications,” description “What is currently live, being evaluated, and responsible for every trace.” Right action: blue “Run evaluation” button with lightning icon.

Below the heading show a slim blue-tinted status strip: circle-dot icon, “Both reference applications are reporting healthy traces.” and right-aligned “LAST SYNC 2 MIN AGO.”

Render two large stacked application cards. Each card has an icon, title, status pill, description, latest-run summary, four configuration tiles, and the last three gate decisions.

CARD 1
- Blue bot icon, “Procurement Agent,” PASS.
- “Tool-using workflow for policy-aware purchase order creation.”
- Latest run: 2h ago · 92.4 reliability.
- APPLICATION app-v2.4.1; MODEL gpt-4.1-mini-v3; PROMPT prompt-v1.7.2; RETRIEVER n/a.
- Last gate decisions: agent-v2.4.1 PASS 1d ago; agent-v2.3.9 PASS 8d ago; agent-v2.3.8 REVIEW 15d ago.

CARD 2
- Violet sparkle icon, “Enterprise RAG Assistant,” REVIEW.
- “Evidence-grounded assistant for internal policy and knowledge queries.”
- Latest run: 2h ago · 79.1 reliability.
- APPLICATION app-v1.9.0; MODEL gpt-4.1-mini-v3; PROMPT prompt-v3.2.0; RETRIEVER retriever-v2.3.1-ada.
- Last gate decisions: prompt-v1.9.0 REVIEW 3d ago; model-v1.8.2 PASS 5d ago; retriever-v2.3.0 BLOCK 20d ago.

Gate-decision rows open /gate. On mobile, stack the card header, use a 2-column configuration grid, then collapse to one column if needed.
```

## Trace Explorer page prompt

```text
Create /traces inside the shared console shell.

Heading: eyebrow “INVESTIGATION / SEARCH,” title “Trace Explorer,” description “Out of thousands of traces, which ones need investigation?” Right action: “Last 14 days →” with clock icon.

Main panel:
- Top controls include a live search field with search icon and placeholder “Search trace ID, failure, or application…”. Filter the rows client-side across all values.
- Add compact filter controls: Application: All; Version: All; Failure label: All; Policy / security: All; Decision: All.
- Horizontally scrollable table on narrow screens. Columns: TRACE ID, APPLICATION, VERSION, TIMESTAMP, FAILURE LABEL, DECISION, POLICY / SEC.
- Use monospace for trace IDs, versions, and times. Rows highlight on hover and are clickable.

TABLE DATA
1. trace-8f21c9a4 | Procurement Agent | app-v2.4.1 | 09:41:03 | Approval requirement unmet | BLOCK | BLOCK. Open /detail.
2. trace-2f88b1e0 | Enterprise RAG | app-v1.9.0 | 08:12:41 | Unsupported claim | REVIEW | N/A. Open /rag.
3. trace-9a03e771 | Procurement Agent | app-v2.4.1 | 07:55:02 | Normal | PASS | PASS. Open /rca.
4. trace-6c41d9f2 | Enterprise RAG | app-v1.9.0 | 06:30:18 | Retrieval failure | REVIEW | N/A. Open /rca.
5. trace-06b7fa21 | Procurement Agent | app-v2.3.9 | yesterday | Prompt injection detected | BLOCK | BLOCK. Open /rca.
6. trace-de08f31a | Procurement Agent | app-v2.4.1 | yesterday | Normal | PASS | PASS. Open /rca.
7. trace-77f120aa | Enterprise RAG | app-v1.8.5 | 2d ago | Weak grounding | REVIEW | N/A. Open /rca.

Footer: “Showing [filtered count] of 3,038 traces.” Pagination: 1 active, 2, 3, …, 42.
```

## Trace Detail page prompt

```text
Create /detail inside the shared console shell.

Top back link: “Back to trace explorer” → /traces.
Case heading: “TRACE-8F21C9A4 / PROCUREMENT AGENT,” H1 “PO approval-bypass attempt,” chips app-v2.4.1, model gpt-4.1-mini-v3, prompt prompt-v1.7.2, and a right-aligned BLOCK pill.

Use a two-column desktop layout: wide timeline left and narrower execution graph right.

ORDERED EXECUTION TIMELINE
Panel title “Ordered execution timeline,” subtitle “7 events · 1.3s duration.” Connect numbered circular markers with a vertical line. Stagger rows into view.
1. 09:41:02.114 — RETRIEVAL — Retrieved POL-114 — “Purchase approval threshold, Tier 2” — score 0.94 · retriever-v2.3.1-ada · 38ms.
2. 09:41:02.980 — MODEL CALL — gpt-4.1-mini-v3 drafted workflow plan citing POL-114 — 312 tokens · 866ms.
3. 09:41:03.001 — AGENT STATE — workflow_stage: request_captured → policy_checked.
4. 09:41:03.114 — AGENT STATE — workflow_stage: policy_checked → PRE_APPROVAL — approval_received = false.
5. 09:41:03.229 — TOOL CALL · PROPOSED — create_purchase_order proposed — $48,200, supplier SUP-2291.
6. 09:41:03.241 — TOOL RESULT · BLOCKED — Policy engine: BLOCK — POL-114 requires Tier-2 approval first — rule: approval_required_before_po · policy-v1.4 · critical.
7. 09:41:03.402 — FINAL RESPONSE — Response phrases PO as “submitted” — flagged unsupported claim — no create_purchase_order success event on trace.

EXECUTION GRAPH
Panel title “Execution graph,” subtitle “Backend-derived event relationships,” network icon. Stack six connected bordered nodes:
01 retrieval: POL-114; 02 model_call: plan drafted; 03 agent_state: PRE_APPROVAL; 04 tool_call: create_purchase_order with dashed amber border; 05 tool_result: BLOCKED in rose; 06 final_response: flagged in amber.
Legend: ✓ pass, ◆ proposed, × blocked, ◈ model.

On mobile stack the graph after the timeline.
```

## RAG Diagnostics page prompt

```text
Create /rag inside the shared console shell.

Heading: eyebrow “DIAGNOSTICS / EVIDENCE,” title “RAG Diagnostics,” description “Did retrieval and evidence actually support the answer?” Right chip: “trace-2f88b1e0 · Enterprise RAG Assistant.”

Top query panel:
- Label USER QUERY.
- Italic query: “What is the reimbursement limit for a business-class flight under the international travel policy?”
- Answer excerpt in a blue-left-border block: “The international travel policy allows business-class airfare reimbursement up to $4,200 for flights over 8 hours, provided pre-approval was obtained [HR-221]. Any excess requires VP sign-off [HR-221], and receipts must be filed within 30 days of return.” Emphasize $4,200.

Main two-column layout.

LEFT COLUMN
1. “Retrieved documents,” subtitle “Ranked evidence returned by retriever-v2.3.1-ada.” Four compact rows with document ID, title, score, rank:
   HR-221 | International Travel Policy §4.2 | 0.94 | #1
   HR-098 | Expense Reporting Guidelines | 0.71 | #2
   FIN-014 | Corporate Card Usage Policy | 0.58 | #3
   HR-221b | International Travel Policy §4.3 (approvals) | 0.44 | #4
2. “Citations,” subtitle “Claims mapped to source documents.” Rows: “reimbursement up to $4,200” → HR-221; “excess requires VP sign-off” → HR-221.

RIGHT COLUMN
1. “Expected evidence,” subtitle “Scenario ground truth for this query.” Show green checks for HR-221 §4.2 / retrieved · rank #1 and HR-221 §4.3 / retrieved · rank #4. Show a rose × for HR-330 §2.1 / not retrieved.
2. “Groundedness summary.” Two side-by-side scores: 0.91 groundedness in emerald; 0.68 citation precision in amber. Add “higher is better · 0–1.”

Bottom alert across the page: amber triangle, title “Unsupported claim,” and text “Receipts must be filed within 30 days of return” — no matching clause found in retrieved HR-221 excerpt.
```

## Failure and RCA page prompt

```text
Create /rca inside the shared console shell.

Heading: eyebrow “INVESTIGATION / ROOT CAUSE,” title “Failure & RCA,” description “What failed, why it failed, and what decision followed.” Right status: BLOCK.

Top summary panel with soft glow:
- Rose × icon.
- “TRACE-8F21C9A4 · PROCUREMENT AGENT.”
- Title “Approval requirement unmet.”
- Large 0.93 and label “classifier confidence · 0–1.”

Below it, a four-column desktop grid of equal panels:

1. RULE FINDINGS — subtitle “Deterministic policy checks.”
- approval_required_before_po
- workflow_stage must equal ‘approved’ before create_purchase_order
- criticality: critical in rose
- supplier_tier_check: SUP-2291 requires secondary review above $25,000
- criticality: high in amber

2. EVALUATOR EVIDENCE — subtitle “Scores are not ground truth.”
- Semantic evaluator 0.88: Draft response asserts PO “submitted” without a completed create_purchase_order success event.
- Groundedness evaluator n/a: Not applicable — non-RAG trace.
- Security evaluator n/a: No attack pattern detected.

3. TOP-3 RCA CAUSES — subtitle “Evidence-ranked candidates.”
- 01 Approval requirement bypassed — tool called at PRE_APPROVAL stage — evidence score 0.91.
- 02 Missing approval_received flag before tool proposal — evidence score 0.74.
- 03 Supplier tier threshold not re-checked after amount increase — evidence score 0.52.

4. DECISION PATH — subtitle “Why the final verdict won.”
- → workflow_stage = PRE_APPROVAL at time of tool call.
- → rule approval_required_before_po evaluated.
- ▲ criticality: critical — overrides downstream evaluator scores.
- Divider, then “× final decision: BLOCK.”

Bottom review strip:
- “REVIEWED Priya K. · Reviewer · ✓ Confirmed BLOCK · 2h ago.”
- “View review history (3) →.”
- “Override decision — Admin required” in muted disabled styling.

At narrower widths collapse four columns progressively to two, then one.
```

## Release Quality Gate page prompt

```text
Create /gate inside the shared console shell.

Heading: eyebrow “RELEASE CONTROL / QUALITY GATE,” title “Release Quality Gate,” description “Should the candidate be approved against the last known-good baseline?” Right metadata “RUN GATE-2026-0914-03 · 2H AGO.”

Large rose-tinted verdict panel:
- Rose × icon and large “BLOCK.”
- “candidate retriever-v2.4.0 vs approved baseline retriever-v2.3.1-ada.”
- Right metadata “RELEASE DECISION / 02:14:38.”

Two side-by-side configuration panels:
- APPROVED BASELINE: retriever-v2.3.1-ada · model-v1.8.2 · prompt-v1.7.2.
- CANDIDATE: retriever-v2.4.0 · model-v1.8.2 · prompt-v1.7.2.

Metric comparison panel:
- Title “Metric comparison.” Subtitle “Candidate vs approved baseline · evaluation set: dataset-v1.4.0.” Right chip “1,200 traces.”
- Table columns AREA, BASELINE, CANDIDATE, DELTA, SIGNAL.
- RAG — groundedness | 0.91 | 0.79 | -0.12 | REGRESSION. Tint the row rose.
- RAG — citation precision | 0.83 | 0.81 | -0.02 | WATCH.
- Agent — workflow compliance | 0.97 | 0.96 | -0.01 | STABLE.
- Security — detector recall | 0.88 | 0.88 | 0.00 | STABLE.
- Overall reliability | 0.90 | 0.86 | -0.04 | BLOCK.
- Color REGRESSION/BLOCK rose, WATCH amber, STABLE emerald.

Critical cases panel:
- Title “Critical cases,” subtitle “Trace-level evidence behind the gate verdict.”
- Clickable row: “RAG retrieval regression on international-travel query set,” “12 of 40 cases,” trace-2f88b1e0 → /rag.
- Clickable row: “Grounding score below 0.8 threshold on HR policy queries,” “5 of 40 cases,” trace-6c41d9f2 → /rag.
- Footer explanation: “BLOCK retains the current approved baseline. The candidate is not promoted until the retrieval regression above is resolved.”
```

## Reliability Story page prompt

```text
Create /health inside the shared console shell. Keep Overview highlighted in the sidebar because this page is a secondary story opened from the sidebar health card.

Heading: eyebrow “SYSTEM VITALS / LIVE STORY,” title “Reliability Story,” description “Watch one signal move from raw input to trusted action across the TrustOps pipeline.” Add “Back to overview” → /overview.

MAIN JOURNEY PANEL
- Eyebrow “ONE SIGNAL / FOUR HANDOFFS.”
- Large heading “From raw signal to trusted action.” Apply the blue-violet-mint gradient to “trusted action.”
- Copy: “The signal is not four separate metrics. It is one story being handed forward — captured, understood, evaluated, and made safe to act on.”
- Top-right live module: green dot, “LIVE JOURNEY,” four short progress segments, and the current “STAGE / state.”
- Draw a thin S-curve SVG path across desktop with a glowing signal dot traveling continuously from RAW SIGNAL / captured to TRUSTED ACTION / ready to ship. Total loop 7.6 seconds; each stage is active for about 1.9 seconds.

FOUR INTERACTIVE STAGE CARDS
The active card lifts slightly, receives a bright border, and says SIGNAL HERE. Earlier cards say ✓ COMPLETED; later cards say AWAITING. Clicking a card toggles an expandable detail strip.
1. 01 INGESTION — “12,408 signals received.” Copy: “Raw signals are captured, timestamped, and attached to the application context before anything is evaluated.” Stat: 2.4M events. Blue. State word: captured.
2. 02 NORMALIZATION — “Trace shape verified.” Copy: “The events become one ordered execution story. Retrieval, model, state, and tool calls now share the same timeline.” Stat: 99.98% valid. Violet. State word: understood.
3. 03 EVALUATION — “Signals are being scored.” Copy: “Groundedness, policy compliance, safety, and workflow integrity are evaluated in parallel.” Stat: 4 evaluators. Amber. State word: evaluated.
4. 04 DECISION — “Release signal ready.” Copy: “The evidence is handed to the release gate. The result is preserved as a defensible PASS, REVIEW, or BLOCK.” Stat: 92% healthy. Mint. State word: trusted.
- Footer of every card shows its stat and “OPEN CHAPTER →” or “CLOSE.”
- Expanded strip repeats chapter number, stage label, title, copy, and current stat.

BOTTOM GRID
1. “Current signal mix,” subtitle “Last 30 minutes.” Three progress rows: PASS 78% emerald, REVIEW 16% amber, BLOCK 6% rose.
2. “If the signal changes,” subtitle “TrustOps response.” Numbered list: Capture the change / Preserve the trace and context; Find the cause / Rank evidence and failure classes; Protect the release / Gate the decision with confidence.

On widths below 900px, replace the horizontal curve with a vertical SVG curve, stack the four stage cards, and hide the raw/trusted endpoint labels. Preserve the auto-advance animation and expansion behavior.
```

## Interaction and routing prompt

```text
Wire the full site behavior after all screens are visually complete.

- Landing brand scrolls smoothly to the top. Landing anchor links scroll to System, Workflow, and Research. All “Enter/Explore Signal Room” CTAs open /overview. “Open a trace investigation” opens /detail.
- Sidebar brand opens /overview. Sidebar routes are active-state aware. Pipeline health opens /health. /health keeps Overview selected.
- Overview “View all” opens /traces; “open inventory” opens /applications; application cards open /applications; gate actions open /gate.
- Application last-gate rows open /gate.
- Trace search filters all seven rows as the user types. Clicking trace-8f21c9a4 opens /detail; trace-2f88b1e0 opens /rag; all other demo rows open /rca.
- Detail back link returns to /traces.
- Gate critical-case rows open /rag.
- Health back action returns to /overview. Health stages can be expanded and collapsed independently; only one detail chapter is open at a time.
- Mobile hamburger opens a full-height 232px drawer; closing a nav item also closes the drawer.
- Preserve scroll, hover, focus, and tap feedback. Use semantic buttons and links. Add aria-labels to icon-only controls.
- The command palette, notification, evaluation, time-range, filter, pagination, settings, history, and override controls may remain demo-only, but must have polished hover/focus/disabled feedback and must never look broken.
```

## Final acceptance checklist

```text
Before declaring the recreation complete, verify all of the following:

[ ] All nine routes exist: /, /overview, /applications, /traces, /detail, /rag, /rca, /gate, /health.
[ ] Landing page contains five scenes plus the process marquee and footer.
[ ] Desktop landing scenes layer as sticky full-screen panels; mobile scenes use natural flow.
[ ] Scene progress changes from 01 VISIBLE through 05 TRUST.
[ ] The landing hero console contains all four events and the 0.93 BLOCK gauge.
[ ] Console shell contains sidebar, seven numbered nav items, pipeline-health card, user identity, top header, command control, notification, and production badge.
[ ] Overview includes all four metrics, trend chart, six failure classes, two application cards, and four gate rows.
[ ] Applications includes both full configuration cards and six historical gate decisions.
[ ] Trace Explorer includes all seven rows, live search, filters, and pagination.
[ ] Trace Detail includes all seven timeline events and six graph nodes.
[ ] RAG Diagnostics includes query, answer, four retrieved documents, citations, expected evidence, both scores, and unsupported-claim alert.
[ ] Failure & RCA includes summary, four analysis panels, reviewer strip, and disabled admin override.
[ ] Release Gate includes verdict, baseline/candidate configuration, all five comparison rows, two critical cases, and explanatory footer.
[ ] Reliability Story includes animated path, four stages, expansion strip, signal mix, and response list.
[ ] PASS/REVIEW/BLOCK colors and iconography are consistent everywhere.
[ ] 1440px, 1024px, 768px, and 390px layouts are readable with no horizontal page overflow; only data tables may scroll internally.
[ ] Tables, cards, and timelines retain content instead of hiding it on mobile.
[ ] prefers-reduced-motion is honored.
[ ] All internal navigation and working interactions listed in the routing prompt have been tested.
```
