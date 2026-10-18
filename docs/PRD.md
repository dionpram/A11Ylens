# Access Lens — PRD v0.1

**Status:** Starter implementation  
**Product principle:** Earn support by delivering useful results, never by withholding them.  
**Reference feeling:** Airy, warm, friendly and credible. Original identity, not a copy of Airbnb.

## User problem

Public accessibility tools can be technical, issues-only, or difficult for small teams to turn into action. A useful report needs both positive and negative results, concrete element-level fixes and candid disclosure of what hasn't been tested.

## Product promise

**Understand what's working. Fix what isn't. Document what you've tested.**

## Primary audience

Freelance designers and developers, small agencies, startup product teams and website owners. Secondary: NGOs and organizations preparing internal evidence of accessibility evaluation.

## Primary user flow

1. Open the homepage, paste exactly one public page URL, choose **Check page**. No login.
2. Observe a friendly non-fabricated loading state (do not claim exact test progress without real progress data).
3. View the scan score, definition and limitations; failed/passed/review counts.
4. Explore failed findings, WCAG references and affected element selectors.
5. View one dynamic, site-specific before/after contrast fix where technically supported. Fallback: clear textual recommendations / official guidance link.
6. See inline **optional** contribution invitation after tangible value. Dismiss or ignore it without penalty.
7. Inspect passed checks and inconclusive automated checks via tabs.
8. Save a full report as PDF via browser Print/Save as PDF or start another free scan.

## MVP requirements

| ID | Requirement | Acceptance condition |
|----|-------------|---------------------|
| R1 | URL scan | One public HTTP(S) page loads, scanning completes, failed sites give helpful errors |
| R2 | Automated checks | axe-core analyzes page state and reports rule IDs and affected elements |
| R3 | Outcome coverage | Separate violations, passes, inconclusive, not-applicable counts |
| R4 | Score | Clearly describe the reproducible rule-pass-rate formula, not legal compliance |
| R5 | Dynamic contrast | For supported finding, show actual before/after element screenshots, values, ratios and proposed CSS |
| R6 | Honest fallback | Skip unreliable visual previews instead of showing invented fixes |
| R7 | PDF export | Save all categories, evaluated scope and methodology as browser PDF |
| R8 | Voluntary contributions | Never block the report, suggestions or download; external donation link optional |
| R9 | Responsive / accessible UI | Keyboard navigation, semantic controls, reduced motion, visible focus and readable contrast |
| R10 | Single page | No signup, no bulk scan, no site-wide compliance claim |

## Definitions and epistemic limits

- **Failed:** one or more applicable automated checks detected a violation. Impact is axe-core severity, not legal impact.
- **Passed:** applicable automated rule instances passed. Passing the rule does **not** prove the entire WCAG criterion passes everywhere.
- **Needs review:** axe-core returned an inconclusive result or the general methodology calls for manual evaluation.
- **Not applicable:** that automated rule did not apply to scanned DOM state.
- **Not tested:** entire WCAG requirements beyond automation; described in the limitations, not silently counted as passes.
- **Score:** `passed unique rule IDs / (passed + failed rule IDs)` excluding inconclusive IDs, display as automated rule pass rate only.

## Trust and legal positioning

Reports include scan time, final URL, viewport, browser engine, WCAG mapping, results and limitations. These are assessment records, not proof of legal conformity, legal opinions, signed certificates or guarantees. A court or regulator may require expert/manual evaluation and further evidence.

## Interaction and content strategy

- Summary first, detailed findings next, optional support after the first detailed issue, positive results available as a tab.
- Friendly and matter-of-fact copy; avoid shame, compliance fear, paywall pressure and premature confetti.
- Visual fix should be actual page capture when feasible, not a generic composited mockup. Render a conspicuous *example* label on fictional displays.

## Out of scope for v0.1

Accounts, PDF hosting, histories, crawling multiple URLs, mobile-state analysis, logged-in scanning, monitoring, automated legal certification, full AI-powered CSS generation, multiple proposals, subscription tiers, headless agent installation on the customer website.

## Future hypotheses (not promises)

- Alternative design recommendations (possibly paid), advanced exports, batch scanning.
- Optional signed evaluation record, improved verified metadata, manual evaluation checklist.
- SaaS tier only after repeat usage and willingness-to-pay validation.
