---
title: "ICAR-MR — pula zadań"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "783c12b119ca4dbf78c6e6db29b8fe99bf9e9b62a76ce495cd2577393c3e6ecd"
translationStatus: "in-progress"
---

# ICAR-MR — pula zadań

ICAR-MR jest publicznie dostępną pulą zadań, z której korzysta IQ-ME. ICAR to skrót od International Cognitive Ability Resource (Międzynarodowy Zasób Zdolności Poznawczych). Został opracowany przez grupę akademicką na Northwestern University we współpracy z Open Source Psychometrics.

Grupa zbudowała pulę, aby udostępnić zadania wolne od licencji na potrzeby badań poznawczych. Większość zadań poznawczych jest objęta licencją. Badacze nie mogą swobodnie używać ich w otwartych pracach. ICAR jest rzadkim wyjątkiem.

Pula posiada dane kalibracyjne. Licencja zezwala na ponowne użycie. Grupa ją utrzymuje.

IQ-ME używa 16 zadań ICAR-MR na sesję. Pełna pula jest większa niż 16. Skriner dobiera zadania z puli według ustalonej reguły.

Dwie osoby badane, które zaczną w tej samej chwili, otrzymają te same zadania. Dwie sesje tej samej osoby badanej w różnych momentach czasowych dają różne zestawy.

Informacja o licencji znajduje się na stronie licencji ICAR. Sama licencja oczekuje na zatwierdzenie przez Gate-9a ze strony opiekunów ICAR. Skriner traktuje tę bramkę jako warunek konieczny dla wydania.

Algorytm doboru zadań opisano w sekcji dotyczącej punktacji. W skrócie: zadania obejmują zakres trudności. Sesja 16-zadaniowa wyznacza zdolność z dobrą precyzją w środku zakresu. Sesja ma szerszą niepewność na krańcach. Pełna procedura znajduje się w kodzie źródłowym silnika punktacji.

## Pasma trudności: łatwe, średnie i trudne

Pula jest podzielona na trzy pasma trudności według tercyli parametru b IRT. Dolna tercja zadań według b tworzy pasmo łatwe. Górna tercja tworzy pasmo trudne. Środkowa tercja tworzy pasmo średnie. Reszta przy nierównym podziale trafia do pasma średniego.

Zadania, dla których wartość b jest równa punktowi granicznemu tercyla, pozostają w niższym paśmie. Reguła ma naturalne brzmienie: zadania łatwe to te z b na poziomie lub poniżej punktu granicznego dla łatwych; zadania średnie to te z b na poziomie lub poniżej punktu granicznego dla średnich; zadania trudne to wszystkie powyżej.

To przypisanie do pasma trudności poszczególnych zadań różni się od jakościowej etykiety pasma stosowanej do samego wyniku. Pasmo wyniku opisuje, gdzie w rozkładzie odniesienia plasuje się szacunek zdolności osoby badanej. Pasmo zadania opisuje, jak trudne było każde prezentowane zadanie. Strona wyników raportuje oba, a zdanie opisujące rozkład trudności przy wyniku pełni funkcję przypisu zasługującego na uwagę.

Zob. [omówienie punktacji](../../scoring/overview/), aby zobaczyć, jak to jest wyświetlane na stronie wyników.
