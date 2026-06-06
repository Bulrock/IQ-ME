---
title: "Estymacja EAP — przeliczanie odpowiedzi na wynik"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts:
  - "eap-estimation-method"
  - "quadpts-61"
  - "theta-lim-pm-6"
  - "prior-standard-normal"
glossaryRefs: []
sourceHashEN: "c2a8dd3b6f6385874ab1eb7642c620b734324658229ee142ecd72c81fa120a69"
translationStatus: "in-progress"
---

# Estymacja EAP — przeliczanie odpowiedzi na wynik

Po sesji składającej się z 16 odpowiedzi IQ-ME oblicza zdolność osoby badanej metodą estymacji oczekiwanej a posteriori, czyli EAP. EAP to metoda bayesowska. Daje ona estymator punktowy oraz miarę niepewności tego estymatora.

Wzór ma postać: `theta_EAP = sum_i nodes[i] * L(nodes[i] | r) * weights[i] / sum_i L(nodes[i] | r) * weights[i]`.

Intuicja stojąca za metodą: silnik rozważa zbiór kandydatów na wartość zdolności wzdłuż skali theta. Dla każdego kandydata oblicza prawdopodobieństwo, że zaobserwowany wzorzec odpowiedzi osoby badanej pochodzi od kogoś o takiej właśnie zdolności. Następnie wyznacza ważoną średnią tych kandydatów. Wagi łączą wiarygodność z priorem określającym, które wartości zdolności są w ogóle wiarygodne.

Trzy wybory numeryczne precyzują implementację. Pierwszym jest liczba kandydatów na wartości zdolności, zwana punktami kwadratury. IQ-ME używa `quadpts = 61`. Drugim jest zakres, który te kandydatury obejmują. IQ-ME używa `theta_lim = [-6, 6]` — sześć odchyleń standardowych po obu stronach średniej pokrywa pełen wiarygodny zakres zdolności. Trzecim jest prior. IQ-ME stosuje standardowe rozkład normalny: `weights[i] = phi(nodes[i]) / sum_j phi(nodes[j])`, gdzie `phi` jest gęstością standardowego rozkładu normalnego.

Prior oparty na standardowym rozkładzie normalnym zakłada, że zdolności w populacji rozkładają się normalnie wokół średniej. To założenie jest w przybliżeniu prawdziwe dla próby referencyjnej SAPA. Na skali zdefiniowanej przez model jest ono ścisłe.

Silnik zawarty w plikach `src/scoring/irt/eap.js` oraz `src/scoring/irt/quadrature.js` implementuje EAP i wspierającą go kwadraturę. Sceptyk może uruchomić testy jednostkowe pod ścieżką `tests/unit/scoring/irt/eap.test.mjs` i zweryfikować, że implementacja odpowiada matematyce.
