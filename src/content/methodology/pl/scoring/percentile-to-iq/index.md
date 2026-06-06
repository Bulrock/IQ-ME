---
title: "Co oznacza percentyl"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts:
  - "percentile-from-standard-normal-cdf"
glossaryRefs:
  - "percentile"
sourceHashEN: "d45a80aaee241eb457540d181b94d353403d8a08354e96874ac09037e2afd1ec"
translationStatus: "in-progress"
---

# Co oznacza percentyl

Twój percentyl to pozycja w rankingu. Umieszcza Twój wynik względem grupy referencyjnej osób badanych na skali od 0 do 100.

Percentyl 58 oznacza, że mniej więcej 58 na każde 100 podobnych osób badanych uzyskało wynik równy Twojemu lub niższy. Percentyl 5 plasuje Twój wynik blisko dolnej granicy grupy referencyjnej. Percentyl 95 plasuje go blisko górnej granicy.

Percentyle kompresują ciągły wynik na znajomą skalę rankingową. Bazowy wynik to estymator zdolności ukrytej z teorii odpowiedzi na pozycje testowe; percentyl jest przekształceniem tego estymatora przez dystrybuantę standardowego rozkładu normalnego. Wzór ma postać `percentile = 100 × Φ(theta)`, gdzie `theta` to Twój estymator zdolności, a `Φ` to dystrybuanta standardowego rozkładu normalnego.

Grupa referencyjna ma znaczenie. Niniejszy percentyl jest obliczany względem próby normalizacyjnej pochodzącej z projektu SAPA, która nadreprezentuje piśmiennych, korzystających z internetu dorosłych anglojęzycznych. Jeśli Twoje środowisko różni się od tej próby, Twój estymator percentyla jest mniej precyzyjny niż ten sam wynik z próby lepiej do Ciebie dopasowanej.

Percentyl nie jest werdyktem. Jest to ranking względem jednej konkretnej grupy, obliczony jedną konkretną metodą, na podstawie jednego krótkiego testu przesiewowego. Dwie osoby badane różniące się o jeden punkt percentylowy nie różnią się znacząco zdolnościami; szum pomiarowy jest szerszy niż taka różnica.

Możesz przeczytać o tym, jak obliczany jest bazowy wynik zdolności i jak jest on przekształcany na kotwicę skali IQ, na pozostałych stronach punktacyjnych tego korpusu.

[Powrót do IQ-ME](/)
