# Riposta: plan biznesowy

**Obietnica:** nie wiesz, co odpisać? 50 groszy i masz idealną odpowiedź.

## Dlaczego każdy to kupi i będzie kupował ciągle

- Każdy pisze wiadomości codziennie. Kilka razy w tygodniu każdy ma wiadomość, nad którą siedzi 10 minut:
  szef w niedzielę, ex po pół roku, randka, która odpisała „ok”, teściowa, klient, który nie płaci.
- 0,50 zł to mniej niż guma do żucia. Nikt się nad tym nie zastanawia (zakup impulsowy).
- Problem wraca sam, więc zakup też wraca. To nie jest produkt kupowany raz.
- Zabawa (poziom pazura, ocena 🔥, przewidywana reakcja, osiągnięcia) sprawia, że ludzie wracają też dla frajdy.

## Cennik

| Wersja | Cena | Za sztukę |
|---|---|---|
| **Podstawowa** | **0,50 zł / riposta** z portfela | 0,50 zł |
| Pakiet Mały | 5 zł / 10 ripost | 0,50 zł |
| Pakiet | 9 zł / 20 ripost | 0,45 zł |
| Pakiet Duży | 20 zł / 50 ripost | 0,40 zł |
| Riposta+ (później) | 19 zł / miesiąc bez limitu | wymaga płatności cyklicznych |

Na start: 3 riposty gratis. Polecenie znajomemu: +5 ripost dla obu stron.

## Problem mikropłatności i jak go obchodzimy

Jedna płatność BLIK/kartą na 0,50 zł mogłaby w dużej części zniknąć w prowizji operatora.
Dlatego klient **doładowuje portfel** pakietem (od 5 zł), a każda riposta zdejmuje z niego 0,50 zł.
Prowizję płacimy raz na doładowanie, a nie przy każdym użyciu.

## Ekonomia jednego użycia (szacunek)

Jedna riposta to ok. 600 tokenów wejścia i ok. 500 tokenów wyjścia (z krótkim „myśleniem” modelu).

| Pozycja | Model domyślny (Claude Opus 5.5, $4 / $20 za mln tokenów) | Model tani (Claude Haiku 5.5, $0,10 / $0,50) |
|---|---|---|
| Przychód | 0,50 zł | 0,50 zł |
| Koszt AI | ok. 0,05 zł | ok. 0,001 zł |
| Prowizja płatności (ok. 2-3% doładowania) | ok. 0,01-0,02 zł | ok. 0,01-0,02 zł |
| **Zostaje** | **ok. 0,43 zł (ok. 86%)** | **ok. 0,48 zł (ok. 96%)** |

Kurs przyjęty do szacunku: 1 USD ≈ 4 zł. Model zmienia się jedną zmienną `RIPOSTA_MODEL` w `.env`.
Najlepiej porównać jakość obu modeli na kilkudziesięciu prawdziwych wiadomościach i wtedy zdecydować.
Koszty prowizji sprawdź w cenniku wybranego operatora.

## Scenariusze przychodu

| Aktywni użytkownicy | Riposty / tydzień / osoba | Przychód / miesiąc |
|---|---|---|
| 1 000 | 3 | ok. 6 500 zł |
| 10 000 | 3 | ok. 65 000 zł |
| 100 000 | 3 | ok. 650 000 zł |

## Plan na pierwsze 10 000 klientów (social media, zgodnie z filmem)

1. **Format wirusowy:** screen prawdziwej, trudnej wiadomości (zanonimizowanej) → „zobacz, co odpisała Riposta” → reakcja drugiej strony.
   Seria codziennie na TikToku, Reelsach i Shortsach. Aplikacja sama robi gotowy obrazek pionowy (przycisk „Obrazek”).
2. **Seria tematyczna:** „Ex pisze po roku”, „Szef w niedzielę o 22:00”, „Klient chce rabat”, „Teściowa i święta”.
3. **Znak wodny:** każdy obrazek ma logo i hasło „50 groszy za idealną odpowiedź”, więc użytkownicy robią reklamę za darmo.
4. **Polecenia:** link `?ref=KOD` → oboje dostajecie 5 darmowych ripost.
5. **Mikroinfluencerzy** (10-50 tys. obserwujących) z tematyki randek, pracy i humoru: własny kod polecający.
6. **Wyzwanie „Poziom pazura 5”:** użytkownicy nagrywają, jak wysyłają najostrzejszą ripostę i pokazują odpowiedź.

## Co jeszcze przed startem

Lista w [README.md](README.md#checklista-przed-startem): płatności, dane firmy w regulaminie, faktury/paragony, hosting.
