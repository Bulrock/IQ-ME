# IQ-ME Makefile — runtime-zero-build invariant per NFR21/NFR33.
# All dev tools invoked via `npx --yes` or vendor/SHASUMS-pinned files.
# No absolute paths; no env-specific assumptions. See
# docs/corpus-build-conventions.md (Story 1.4) for target conventions.

.DEFAULT_GOAL := help

.PHONY: help test test-network-trace test-full-slice test-byte-stable lint build build-methodology dev clean snapshot-update test-contract

help: ## list documented Make targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) \
	  | awk -F':.*## ' '{printf "%-20s %s\n", $$1, $$2}'

test: ## run node --test against tests/scaffold + tests/contract + tests/unit (Playwright excluded)
	node --test 'tests/scaffold/**/*.test.mjs' 'tests/contract/**/*.spec.mjs' 'tests/unit/**/*.test.mjs'

test-network-trace: ## run Playwright network-trace spec (downloads chromium on first run)
	npx --yes playwright test tests/playwright/network-trace.spec.mjs

test-full-slice: build-methodology ## run Playwright full-slice spec (Story 3-7; builds methodology first)
	npx --yes playwright test tests/playwright/full-slice.spec.mjs

test-byte-stable: ## run Playwright byte-stable build spec (Story 4.2; runs `make clean && make build` twice and compares dist/ hashes)
	npx --yes playwright test tests/playwright/byte-stable.spec.mjs

test-contract: ## run contract tests only (tests/contract/**/*.spec.mjs)
	node --test 'tests/contract/**/*.spec.mjs'

lint: ## run all registered lints (negative assertions + budget + trust artifacts)
	node tools/lint-cognitive-load-budget.mjs
	node tools/lint-trust-artifacts.mjs
	node tools/lint-no-role-alert.mjs
	node tools/lint-no-share.mjs
	node tools/lint-no-cookie-banner.mjs
	node tools/lint-no-analytics-script.mjs
	node tools/lint-no-external-font.mjs
	node tools/lint-no-localStorage-without-consent.mjs
	node tools/lint-claims-manifest.mjs --strict
	node tools/lint-frontmatter.mjs
	node tools/lint-css-source-co-equal.mjs
	npx --yes eslint@^9.16.0 --max-warnings 0 .

build: build-methodology ## alias to build-methodology + emit determinism marker (NFR17 prep)
	node tools/build-determinism-marker.mjs

build-methodology: ## render src/content/methodology/**.md to dist/methodology/v<corpus-version>/<lang>/<path>/index.html + latest companion (Story 4.1)
	# Override version: make build-methodology IQME_CORPUS_VERSION=v1.2.0
	node tools/build-methodology.mjs

dev: ## start the interim dev-server on http://127.0.0.1:4173 (Ctrl-C to stop; Epic 4 lands live-reload)
	node tools/dev-server.mjs

clean: ## remove build outputs (idempotent)
	rm -rf dist

snapshot-update: ## regenerate tests/snapshots/ tree (tokens.hash.json + methodology golden HTML — codified D→E write boundary)
	# Run after deliberate changes to css tokens OR methodology source; commit the snapshot diff alongside the source change.
	node tools/snapshot-update.mjs
