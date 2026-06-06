---
title: "Co oznacza pasmo niepewności"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts:
  - "se-total-rss"
glossaryRefs:
  - "uncertainty"
  - "sem"
sourceHashEN: "4e8e50ac409dde634f6e8a1c4843c396a8ed028771fa0ec2ca9ed344053dcd23"
translationStatus: "in-progress"
---

# Co oznacza pasmo niepewności

Twój wynik to jeden estymator. Pasmo niepewności wokół niego pokazuje zakres wiarygodnych wyników przy danej precyzji pomiaru.

Wyświetlamy pasmo jako `±N`. Odczytaj je w następujący sposób: Twój prawdziwy wynik ukryty mieści się wiarygodnie w przybliżeniu w odległości N punktów w każdą stronę od wyświetlonej liczby, przy około 95-procentowym poziomie ufności.

Pasmo łączy dwa źródła niepewności. Pierwszym jest sam test: sesja przesiewowa złożona z 16 pozycji pozostawia miejsce na szum odpowiedzi. Podsumowujemy to standardowym błędem pomiaru, czyli SEM, obliczonym z wariancji posteriori estymatora zdolności. Drugim jest próba normalizacyjna: konwersja percentyla na skalę IQ była kalibrowana względem jednej skończonej grupy referencyjnej, a ta próba ma własną niepewność, zwaną SE_norming.

Pełny wzór łączy je obie: `SE_total = sqrt(SEM² + SE_norming²)`. Pasmo widoczne na panelu wyników używa `SE_total` rzutowanego na skalę IQ.

W wersji v1 niniejszego narzędzia przesiewowego `SE_norming` jest ustawione na 0. Jest to wartość zastępcza oczekująca na zatwierdzenie przez psychometryka wartości SE próby normalizacyjnej. Bieżące pasmo odzwierciedla zatem wyłącznie szum testowy, a nie szum próby normalizacyjnej. Wyświetlane pasmo jest węższe od prawdziwego o wielkość, której nie możemy jeszcze oszacować. Zaktualizujemy tę stronę po sfinalizowaniu SE normalizacji.

Pasmo niepewności jest rzetelnym sygnałem. Wynik nigdy nie jest punktem; jest obszarem. Osoba badana, która widzi `124 ± 7`, powinna traktować swój wynik jako mieszczący się gdzieś między 117 a 131, przy czym wyświetlona wartość stanowi estymator środkowego punktu.

[Powrót do IQ-ME](/)
