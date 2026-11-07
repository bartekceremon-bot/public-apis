# Riposta: plan biznesowy

**Obietnica:** nie wiesz, co odpisać? 50 groszy i masz idealną odpowiedź.

## Dlaczego każdy to kupi i będzie kupował ciągle

- Każdy pisze wiadomości codziennie. Kilka razy w tygodniu każdy ma wiadomość, nad którą siedzi 10 minut:
  szef w niedzielę, ex po pół roku, randka, która odpisała „ok", teściowa, klient, który nie płaci.
- 0,50 zł to mniej niż guma do żucia. Nikt się nad tym nie zastanawia (zakup impulsowy).
- Problem wraca sam, więc zakup też wraca. To nie jest produkt kupowany raz.

## Cennik

| Wersja | Cena | Co dostajesz |
|---|---|---|
| **Podstawowa** | **0,50 zł / riposta** | 3 odpowiedzi w 3 stylach (Na luzie, Elegancko, Z pazurem) |
| Pakiet | 9 zł / 20 ripost | 0,45 zł za sztukę |
| Riposta+ | 19 zł / miesiąc | bez limitu, własny styl pisania, historia rozmów |

Na start: 3 riposty za darmo, żeby każdy spróbował.

## Problem mikropłatności i jak go obchodzimy

Jedna płatność BLIK/kartą na 0,50 zł mogłaby w dużej części zniknąć w prowizji operatora.
Dlatego klient **doładowuje portfel** (10 / 20 / 50 zł), a każda riposta zdejmuje z niego 0,50 zł.
Prowizję płacimy raz na doładowanie, a nie przy każdym użyciu.

## Ekonomia jednego użycia (szacunek)

| Pozycja | Kwota |
|---|---|
| Przychód | 0,50 zł |
| Koszt modelu AI (mały, szybki model; ok. 400 tokenów wejścia + 300 wyjścia) | ok. 0,01 zł |
| Udział w prowizji płatniczej (ok. 0,40 zł na doładowanie 10 zł = 20 ripost) | ok. 0,02 zł |
| **Zostaje** | **ok. 0,47 zł (ok. 94%)** |

Liczby kosztów to szacunki. Przed startem trzeba je sprawdzić w cenniku wybranego dostawcy AI i operatora płatności.

## Scenariusze przychodu

| Aktywni użytkownicy | Riposty / tydzień / osoba | Przychód / miesiąc |
|---|---|---|
| 1 000 | 3 | ok. 6 500 zł |
| 10 000 | 3 | ok. 65 000 zł |
| 100 000 | 3 | ok. 650 000 zł |

## Plan na pierwsze 10 000 klientów (social media, zgodnie z filmem)

1. **Format wirusowy:** screen prawdziwej, trudnej wiadomości (zanonimizowanej) → „zobacz, co odpisała Riposta" → reakcja drugiej strony.
   Seria codziennie na TikToku, Reelsach i Shortsach.
2. **Seria tematyczna:** „Ex pisze po roku", „Szef w niedzielę o 22:00", „Klient chce rabat", „Teściowa i święta".
3. **Znak wodny:** każda riposta da się udostępnić jako obrazek z małym „riposta.pl", więc użytkownicy robią reklamę za darmo.
4. **Polecenia:** poleć znajomemu → oboje dostajecie 5 darmowych ripost.
5. **Mikroinfluencerzy** (10–50 tys. obserwujących) z tematyki randek, pracy i humoru: kod na 10 darmowych ripost.

## Co jest w prototypie

`index.html` to działająca strona: wklejasz wiadomość, wybierasz, od kogo jest, i dostajesz 3 odpowiedzi od Claude.
Portfel i doładowania są **symulowane** (demo, bez prawdziwych płatności). Do prawdziwego startu potrzebne są:
backend z kluczem API, bramka płatnicza (BLIK / Przelewy24 / Stripe), regulamin i polityka prywatności (RODO),
bo użytkownicy wklejają prywatne wiadomości.
