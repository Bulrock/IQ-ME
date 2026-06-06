---
title: "Jak cytować IQ-ME"
version: "0.1.0"
lastReviewed: "2026-06-03"
reviewer: "TBD"
reviewerHandle: "@TBD-pl-reviewer"
asserts: []
glossaryRefs: []
sourceHashEN: "a2405580b789550e14bbf8162a920118bc40a958b3af5f16cda7e2ea5d9f2bab"
translationStatus: "in-progress"
---

# Jak cytować IQ-ME

Autor cytujący IQ-ME w pracy naukowej, dziennikarskiej lub encyklopedycznej (wiki) powinien odwołać się do konkretnej wersji korpusu, którą czytał, a nie do ogólnego odniesienia do projektu. Wersja korpusu zakotwicza cytowanie w zamrożonym stanie metodologii, który czytelnik może zweryfikować.

IQ-ME udostępnia dwa szablony cytowania na każdej stronie metodologicznej: wpis w stylu APA oraz wpis w formacie szablonu Wikipedii. Oba są wypełniane przez widżet „cytuj tę stronę" umieszczony u dołu każdej strony. Widżet odczytuje frontmatter strony w celu uzyskania wersji, daty ostatniego przeglądu i recenzenta, a następnie generuje gotowy do skopiowania blok cytowania.

Wpis w stylu APA ma postać: `IQ-ME Project. (YYYY-MM-DD). Title of page. IQ-ME methodology v<version>. <permalink>`. Trwały link (permalink) odpowiada wzorcowi URL z numerem wersji `/methodology/v<X>.<Y>.<Z>/<lang>/<path>/`.

Wpis w formacie szablonu Wikipedii korzysta z szablonu MediaWiki `cite web` z polami title, url, website (IQ-ME), date, access-date i version. Autor korzystający z MediaWiki może wkleić gotowy blok bezpośrednio do listy przypisów.

Format BibTeX jest opcjonalnym udogodnieniem dla prac naukowych. Nie jest uwzględniony w wersji v1; trafi do następczej aktualizacji v1.0.1. Plik CITATION.cff w katalogu głównym repozytorium zawiera podstawowe metadane cytowania w formie czytelnej maszynowo. Menedżer cytowań obsługujący format CFF może na jego podstawie wygenerować BibTeX.

Gwarancja trwałości DOI zawarta w niefunkcjonalnych wymaganiach projektu oznacza, że wersja korpusu po udostępnieniu posiada stabilny adres URL. Zobowiązanie do redundancji archiwalnej w Internet Archive i Software Heritage oznacza, że adres URL będzie nadal aktywny, nawet jeśli główny hosting projektu ulegnie awarii. Autorzy cytujący mogą polegać na trwałym linku wersji jako długoterminowym odniesieniu.

Pełna polityka wersjonowania dla kolejnych wydań korpusu znajduje się w changelogu. Nowa wersja jest wydawana, gdy korpus metodologiczny zmienia się w sposób wpływający na cytowanie. Wydania patch dla poprawek typograficznych nie zmieniają cytowania; wydania minor dodające treść — tak; wydania major zmieniające twierdzenie wymagają odpowiedniego podwyższenia numeru wersji silnika.
