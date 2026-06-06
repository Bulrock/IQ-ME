---
title: "Dwuparametryczny model logistyczny IRT"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts:
  - "irt-2pl-model"
glossaryRefs: []
sourceHashEN: "35f151c85951d1356f35cf8696c65e67da0a42a78cd466836fc80ba81f65b7db"
translationStatus: "in-progress"
---

# Dwuparametryczny model logistyczny IRT

IQ-ME ocenia odpowiedzi za pomocą dwuparametrycznego modelu logistycznego z teorii odpowiedzi na pozycje testowe, w skrócie 2PL IRT. Model ten należy do najszerzej stosowanych w psychometrii.

Model stwierdza, że szansa udzielenia poprawnej odpowiedzi na pozycję testową zależy od dwóch rzeczy. Pierwszą jest zdolność osoby badanej. Drugą są właściwości pozycji testowej.

Wzór ma postać: `P(correct | theta, a, b) = 1 / (1 + exp(-a(theta - b)))`.

Tutaj `theta` oznacza zdolność osoby badanej na skali ukrytej. Skala jest wyśrodkowana w zerze. Wyższe wartości oznaczają wyższą zdolność. Parametr `a` to dyskryminacja pozycji. Parametr `b` to trudność pozycji. Oba parametry pochodzą z danych kalibracyjnych dla puli ICAR-MR.

Wyższe `a` oznacza, że pozycja ostrzej rozróżnia osoby o wyższej zdolności od tych o niższej. Wyższe `b` oznacza, że pozycja jest trudniejsza. Dwie osoby o równej zdolności i tak udzielają różnych odpowiedzi z powodu szumu odpowiedzi; model uwzględnia ten szum, przewidując prawdopodobieństwa, a nie pewności.

Model jest jednym z wielu możliwych modeli punktacyjnych. Wybrano go, ponieważ jest dobrze zbadany, ma znane ograniczenia i daje estymaty zgodne z szerszą literaturą psychometryczną. Kod silnika w pliku `src/scoring/irt/likelihood.js` implementuje wzór bezpośrednio. Sceptyk może przeczytać kod źródłowy i zweryfikować matematykę w mniej niż dziesięć minut.
