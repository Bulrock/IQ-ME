---
title: "Złote wektory — zgodność z implementacją referencyjną"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts:
  - "golden-vector-parity-0001-logits"
glossaryRefs: []
sourceHashEN: "17115b7fdb30722e08e40b3ea847b2c3d023500296004094a57decaef2315ac8"
translationStatus: "in-progress"
---

# Złote wektory — zgodność z implementacją referencyjną

Silnik punktacyjny jest tak dobry, jak dobra jest możliwość jego weryfikacji przez sceptyka. Silnik punktacyjny IQ-ME jest sprawdzany względem niezależnej implementacji referencyjnej przy każdym uruchomieniu CI. Sprawdzenie to nosi nazwę parytetu złotych wektorów.

Implementacja referencyjna działa w R. Korzysta z pakietu `mirt` w wersji 1.41.x uruchomionego na R 4.4.x. Pakiet ten jest najszerzej stosowaną implementacją IRT w naukowej psychometrii. Kod źródłowy mirt jest otwarty i podlegał recenzji przez środowisko naukowe.

Sprawdzenie polega na symulowaniu 1000 wzorców odpowiedzi przez oba silniki. Zarówno silnik JavaScript w IQ-ME, jak i referencyjny silnik R obliczają estymaty theta dla tych samych danych wejściowych. Dwa zbiory estymatów są porównywane element po elemencie. Tolerancja parytetu wynosi `0.001 logits`. Większe odchylenie powoduje niepowodzenie CI.

Ziarno dla symulowanych wzorców jest stałe: `set.seed(20260514)`. Ziarno utrwala dane wejściowe. Dwa uruchomienia CI obliczają te same estymaty theta z tych samych danych wejściowych. Deterministyczny harness kompilacji (Story 1.8 / Story 4.2) rozszerza tę właściwość na wyrenderowany korpus metodologiczny.

Dane złotych wektorów znajdują się pod ścieżką `tests/golden/vectors.json`. Skrypt regeneracji R znajduje się pod ścieżką `tests/golden/regenerate.R`. Sceptyk może zainstalować R, zainstalować mirt, uruchomić `Rscript tests/golden/regenerate.R` i odtworzyć bajt-identyczne złote wektory. Bajt-identyczność jest właściwością ziarna i dyscypliny deterministycznej budowy, a nie maszyny hosta.

Filar innowacyjności nr 5 projektu — audytowalny IRT bez kompilacji — jest weryfikowalny przez tę bramkę. Czytelnik mający zainstalowany tylko `node` może uruchomić `node --test tests/unit/scoring/irt/*.test.mjs` i potwierdzić parytet w mniej niż pięć minut. Czytelnik mający zainstalowane `R` może uruchomić skrypt regeneracji i potwierdzić, że dane referencyjne nie uległy dryfowi.
