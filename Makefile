# IQ-ME Makefile — runtime-zero-build invariant per NFR21/NFR33.
# All dev tools invoked via `npx --yes` or vendor/SHASUMS-pinned files.
# No absolute paths; no env-specific assumptions. See
# docs/corpus-build-conventions.md (Story 1.4) for target conventions.

.DEFAULT_GOAL := help

.PHONY: help test lint build build-methodology dev clean snapshot-update

help: ## list documented Make targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) \
	  | awk -F':.*## ' '{printf "%-20s %s\n", $$1, $$2}'

test: ## run node --test against tests/ (exits 0 on empty tree)
	@find tests -name '*.test.mjs' -print -quit | grep -q . && node --test 'tests/**/*.test.mjs' || echo "test: no *.test.mjs files registered yet"

lint: ## run all registered lints (negative assertions + budget + trust artifacts)
	node tools/lint-cognitive-load-budget.mjs
	node tools/lint-trust-artifacts.mjs
	node tools/lint-no-role-alert.mjs
	node tools/lint-no-share.mjs
	node tools/lint-no-cookie-banner.mjs
	node tools/lint-no-analytics-script.mjs
	node tools/lint-no-external-font.mjs
	node tools/lint-no-localStorage-without-consent.mjs

build: build-methodology ## alias to build-methodology (runtime-zero-build per NFR21)

build-methodology: ## render src/content/methodology/**.md to dist/methodology/ (Epic 4 lands tools/build-methodology.mjs)
	@echo "build-methodology: no corpus content to render (Epic 4 lands tools/build-methodology.mjs)"

dev: ## start live-reload static server for corpus authoring (Epic 4 lands tools/dev-server.mjs)
	@echo "dev: live-reload harness not yet implemented (Epic 4 lands tools/dev-server.mjs)"

clean: ## remove build outputs (idempotent)
	rm -rf dist

snapshot-update: ## regenerate golden HTML snapshots (Epic 4 lands tests/snapshots/methodology/)
	@echo "snapshot-update: no snapshots registered yet (Epic 4 lands tests/snapshots/methodology/)"
