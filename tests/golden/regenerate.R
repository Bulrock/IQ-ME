#!/usr/bin/env Rscript
# Story 2.6a — R-mirt golden vector regen.
#
# Reads tests/golden/vectors-smoke.json (JS-engine baseline from Story 2.5),
# computes mirt::fscores(method="EAP", quadpts=61, theta_lim=c(-6, 6)) for each
# entry's responses + itemParameters, and writes the R-derived θ + SE to
# tests/golden/r-output-smoke.json for comparison via parity-audit.mjs.
#
# Pinned per NFR22: R 4.4.x, mirt 1.41.x, set.seed(20260514).
#
# Usage:
#   Rscript tests/golden/regenerate.R --smoke      # n=6 (smoke set)
#   Rscript tests/golden/regenerate.R --full       # n=1000 (deferred to 2.6b)

suppressPackageStartupMessages({
  library(mirt)
  library(jsonlite)
})

set.seed(20260514)

args <- commandArgs(trailingOnly = TRUE)
mode <- if (length(args) >= 1) args[1] else "--smoke"

if (mode == "--full") {
  cat("regenerate.R --full: not yet implemented; see Story 2.6b.\n")
  quit(status = 0)
}

if (mode != "--smoke") {
  cat(sprintf("regenerate.R: unknown mode '%s'. Use --smoke or --full.\n", mode), file = stderr())
  quit(status = 1)
}

smoke <- fromJSON("tests/golden/vectors-smoke.json", simplifyVector = FALSE)

results <- vector("list", length(smoke))

for (i in seq_along(smoke)) {
  entry <- smoke[[i]]
  responses <- unlist(entry$responses)
  items <- entry$itemParameters

  # Build a single-item-bank 2PL model with the entry's pinned a, b parameters.
  # mirt parameterizes 2PL as P = 1 / (1 + exp(-(a1 * theta + d))), so d = -a * b.
  a_vec <- sapply(items, function(it) it$a)
  b_vec <- sapply(items, function(it) it$b)
  d_vec <- -a_vec * b_vec

  # Build a "fake" calibrated mirt model via mod2values + pars="values" pattern.
  # For known-parameter scoring (no estimation), we use mirt::createMirtPars-style
  # injection: construct a minimal item-set + fix the parameters.
  n_items <- length(items)

  # Simulate a placeholder dataset to fit mirt's API, then override parameters.
  placeholder_data <- matrix(
    sample(0:1, n_items * 20, replace = TRUE),
    nrow = 20,
    ncol = n_items,
  )
  colnames(placeholder_data) <- paste0("Item_", seq_len(n_items))

  mod <- mirt(placeholder_data, 1, itemtype = "2PL", verbose = FALSE)
  pars <- mod2values(mod)

  # Override the model parameters with our pinned a, b values.
  for (j in seq_len(n_items)) {
    pars[pars$item == paste0("Item_", j) & pars$name == "a1", "value"] <- a_vec[j]
    pars[pars$item == paste0("Item_", j) & pars$name == "d", "value"] <- d_vec[j]
    pars[pars$item == paste0("Item_", j), "est"] <- FALSE
  }

  mod <- mirt(
    placeholder_data,
    1,
    itemtype = "2PL",
    pars = pars,
    verbose = FALSE,
  )

  response_matrix <- matrix(responses, nrow = 1, ncol = n_items)
  colnames(response_matrix) <- paste0("Item_", seq_len(n_items))

  scores <- fscores(
    mod,
    method = "EAP",
    quadpts = 61,
    theta_lim = c(-6, 6),
    response.pattern = response_matrix,
    full.scores.SE = TRUE,
  )

  rTheta <- round(scores[1, "F1"], 6)
  rSE <- round(scores[1, "SE_F1"], 6)

  results[[i]] <- list(
    entryIndex = i - 1L,
    rTheta = rTheta,
    rSE = rSE
  )
}

write_json(
  results,
  "tests/golden/r-output-smoke.json",
  auto_unbox = TRUE,
  pretty = TRUE,
  digits = 6,
)

cat(sprintf("regenerate.R --smoke: wrote %d entries to tests/golden/r-output-smoke.json\n", length(results)))
