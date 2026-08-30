# Stage Memory: Development

## Lesson: AI-generated "high confidence" external facts (IDs, URLs, citations) require live verification, not plausibility

Source: `run-2026-08-29-wmrt` (Walmart Cart Integration, first pipeline run).

Story 1's developer notes curated 8 Walmart product IDs, labeling 7 of them "high confidence... sourced from model knowledge of Walmart.com... not independently verified" (`06-dev/developer/story-1.md`). All 7 were later confirmed fabricated during UAT spot-check — they resolved to unrelated products or dead pages. Only the 8th (eggs), verified live during the Refine-stage spike, was actually correct.

Separately, the same pipeline's Plan stage had a PO cite a capacity figure (0.8 hr/point) as sourced from `architecture.md`, which does not contain it — another instance of a confidently-stated fact about a source that, on inspection, was wrong.

**Rule for this project's Development stage:** never let a dev-agent's "high confidence" framing about a specific external real-world identifier, URL, or citation stand in as verification. Any such fact must be tagged unverified by default and requires one of:
1. A live browser/tool check performed within the same pipeline run (preferred — this is what actually caught and fixed the issue here), or
2. An explicit, named human sign-off step that is scheduled and actually executed, not merely referenced as a future TODO.

Do not accept "flagged for human spot-check" as closure on its own — track it as an open blocking item until the spot-check is actually run and its result recorded. In this run, the check very nearly wasn't the thing that caught the problem — it worked only because the manual verification step in the UAT plan was executed with real tooling instead of being skipped as "probably fine."

When a fabricated external fact is found, prefer full genuine re-verification/re-curation over quietly dropping the item to preserve a smaller "safe" feature set — this run re-curated all 7 IDs via live browser search rather than settling for reduced coverage.
