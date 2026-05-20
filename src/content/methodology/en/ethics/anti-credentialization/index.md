---
title: "Anti-credentialization — design choices"
version: "0.1.0"
lastReviewed: "2026-05-20"
reviewer: "TBD"
reviewerHandle: "@TBD-en-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "0000000000000000000000000000000000000000000000000000000000000000"
---

# Anti-credentialization — design choices

IQ-ME's result page is designed to be unfriendly to screenshot use. The instrument is not a credential. The design choices on this page enforce that posture against the predictable user behaviour of treating a score as a status object.

The first design choice is the absence of a share button. There is no Tweet-this, no copy-link-to-result, no shareable score artefact. A test-taker who wants to share a score has to take a screenshot. The screener does not help.

The second design choice is the absence of a certificate. There is no PDF download, no signed credential file, no third-party attestation. The result page is a browser-tab page. Closing the tab discards the score. A test-taker who wants the score recorded must explicitly opt in to a local-only save; even then, the screener does not produce a transferable artefact.

The third design choice is the absence of a badge. There is no graphic overlay, no shareable image, no embeddable HTML widget. The score is rendered as text on a page. The page does not render the score in a way that any social platform's link-preview crawler can grab cleanly.

The fourth design choice is page-level tear-edge overlay rendering for top-decile results. The page is rendered with a visual tear-edge along the score's right boundary, biased to crop the score number when the page is captured. The cropping fuzzer in Epic 6 verifies the tear-edge defeats common screenshot crops. A determined screenshotter can defeat the tear; the screener does not pretend otherwise.

The fifth design choice is the absence of a leaderboard. There is no global ranking. There is no comparison to other test-takers by name or handle. A test-taker sees their own score and the population context. They do not see other test-takers.

The cumulative effect of these choices is that the screener is bad at being a credential. That is the design. The instrument exists to give a test-taker a calibrated estimate of one narrow ability. It does not exist to be shared, posted, certified, or ranked. The project's posture is consistent across the methodology corpus, the result page, and the source code.
