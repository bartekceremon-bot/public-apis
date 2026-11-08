# Riposta: pakiet startowy marketingu

> **Zasada nadrzędna tego dokumentu:** nie mamy jeszcze żadnych danych o użytkownikach. Każda liczba poniżej (zasięgi, konwersje, cele) to **ZAŁOŻENIE do przetestowania** albo **CEL**, nigdy fakt. Nie wolno ich cytować publicznie jako wyników.

Szybkie fakty o produkcie (do użycia w treściach):

- Wklejasz wiadomość albo wrzucasz zrzut ekranu (ex, szef, randka, teściowa, klient, grupa, rodzic).
- Ustawiasz **poziom pazura** 1-5: 😇 Anioł → 🙂 → 😏 → 😈 → 🔥 Bez litości.
- Dostajesz **3 gotowe odpowiedzi**: *Na luzie*, *Elegancko*, *Z pazurem*, każda z oceną mocy 🔥 i zabawną „przewidywaną reakcją”.
- **Dekoder: co on/ona miał(a) na myśli?** werdykt, poziom dramy 1-10, czerwone i zielone flagi, rada.
- **0,50 zł za użycie** z portfela. Pakiety: 10 za 5 zł, 20 za 9 zł, 50 za 20 zł. **3 riposty gratis** na start. Polecenie: **+5 ripost dla obu stron** (link `?ref=KOD`).
- Przycisk **„Obrazek”**: gotowa pionowa grafika na TikTok/Insta ze znakiem wodnym „50 groszy za idealną odpowiedź”.
- Treść wiadomości nie jest zapisywana ani logowana (warto to mówić, bo ludzie wklejają prywatne rzeczy).

---

## 1. Pozycjonowanie

**W 3 linijkach:**

1. Riposta to AI, które w 10 sekund podsuwa idealną odpowiedź na wiadomość, nad którą normalnie siedzisz 20 minut.
2. Dla każdego, kto dostał „ok.” od randki, maila od szefa w niedzielę albo „musimy pogadać” od ex.
3. 50 groszy za użycie, trzy style do wyboru i poziom pazura od anioła do „bez litości”.

**5 alternatywnych haseł:**

1. Nie wiesz, co odpisać? 50 groszy i masz idealną odpowiedź.
2. Ostatnie słowo za 50 groszy.
3. Od „ok.” do riposty w 10 sekund.
4. Odpisuj jak ktoś, kto miał czas to przemyśleć.
5. Ty decydujesz, ile pazura. My piszemy resztę.

---

## 2. Plan startu na 30 dni

### Lejek, który mierzymy

```
wyświetlenia filmu → wejścia na stronę → pierwsza riposta (darmowa) → wyczerpanie 3 darmowych → doładowanie portfela → drugie doładowanie
```

### Cele do przetestowania (ZAŁOŻENIA, nie fakty)

Poniższe przedziały to punkty startowe do porównania. Po 7 dniach zastępujemy je własnymi danymi.

| Etap | Wskaźnik | Założony przedział do testu | Skąd mierzyć |
|---|---|---|---|
| Wideo → wejście | kliknięcia w link w bio / wyświetlenia | 0,3-1% (założenie) | statystyki TikTok/IG + UTM |
| Wejście → pierwsza riposta | % odwiedzających, którzy wygenerowali ripostę | 25-45% (założenie) | `/api/admin/stats` (ripostes, newUsers) vs analityka strony |
| Pierwsza riposta → zużyte 3 darmowe | % użytkowników z `freeLeft = 0` | 20-40% (założenie) | `freeUsed` / `users` |
| Zużyte darmowe → doładowanie | % płacących | 5-15% (założenie) | `paymentsPaid` / użytkownicy bez darmowych |
| Polecenia | % użytkowników, którzy przyprowadzili kogoś | 3-10% (założenie) | liczba kodów `?ref=` użytych |
| Udostępnienia | % ripost, z których zrobiono obrazek | do zmierzenia (brak założenia) | dodać licznik kliknięć „Obrazek” |

**Metryki dzienne (arkusz):** posty opublikowane, wyświetlenia, średni czas oglądania, % obejrzeń do końca, wejścia (UTM), nowi użytkownicy, riposty, dekoder, płatności, przychód, rozkład poziomu pazura (`bySpice`), rozkład nadawców (`byWho`), błędy AI.

**UTM:** każdy link w bio i w opisach z parametrami, np. `?utm_source=tiktok&utm_campaign=ex_seria&utm_content=s07`. Dzięki temu wiadomo, który skrypt sprowadził ludzi.

### Rytm publikacji

- **TikTok:** 2 filmy dziennie (np. 12:30 i 20:30; godziny do przetestowania).
- **Reels + Shorts:** te same filmy, bez znaku wodnego TikToka, 1-2 dziennie.
- **Stories Insta:** 3-5 dziennie (ankiety „który styl wysłałbyś?”, suwak poziomu pazura).
- **Komentarze:** odpowiadać filmem na najlepsze komentarze („wrzuć wiadomość, a Riposta odpisze”).

### Tydzień 1 (dni 1-7): start i testowanie haczyków

- Dzień 1: konto TikTok, Instagram, YouTube; bio z hasłem nr 1 i linkiem z UTM; 3 przypięte filmy (skrypty 1, 2, 3).
- Codziennie 2 filmy z różnych serii (ex, szef, randka, teściowa, klient), żeby sprawdzić, który temat niesie.
- Cel tygodnia: znaleźć 2-3 formaty, które mają wyraźnie lepszy % obejrzeń do końca niż reszta.
- Ustawić arkusz metryk i codzienny 10-minutowy przegląd liczb.

### Tydzień 2 (dni 8-14): seria i wyzwanie

- Postawić na 2-3 najlepsze formaty z tygodnia 1 (seria z numerami: „Ex pisze po roku, część 4”).
- Start wyzwania **„Poziom pazura 5”**: zachęcamy widzów do pokazania ripost z aplikacji (tylko zrzuty z zamazanymi danymi).
- Pierwsze 15-20 wiadomości do mikroinfluencerów (sekcja 5).
- Odpowiedzi wideo na komentarze z prośbą „zrób moją wiadomość”.

### Tydzień 3 (dni 15-21): influencerzy i polecenia

- Publikacje mikroinfluencerów z kodami polecającymi; każdy kod mierzony osobno.
- Filmy pokazujące mechanikę poleceń („wyślij link kumplowi, oboje macie +5”).
- Dekoder jako osobna seria („Dekoder ocenia wiadomości od widzów”).
- Test: ten sam skrypt w dwóch wersjach haczyka (A/B), porównać % obejrzeń po 3 sekundach.

### Tydzień 4 (dni 22-30): skalowanie tego, co działa

- Zwiększyć rytm najlepszej serii do 3 filmów dziennie, wyłączyć formaty, które w 3 tygodnie nie ruszyły.
- Ewentualny mały test płatnej promocji (Spark Ads / promowanie postu) **tylko** na filmach z najlepszą organiczną konwersją; treści randkowe kierowane wyłącznie 18+.
- Podsumowanie miesiąca: prawdziwe liczby lejka zamiast założeń z tabeli, decyzja o kolejnych 30 dniach.

---

## 3. 30 skryptów TikTok / Reels / Shorts

Wspólne zasady nagrywania:

- Długość 15-35 s. Haczyk w pierwszych 2 sekundach jako duży tekst na ekranie.
- Wiadomości poniżej są **wymyślone na potrzeby filmów**. Pokazujemy je jako odegrane scenki, nie jako „prawdziwą historię widza”, chyba że widz sam przysłał i zgodził się na publikację (patrz sekcja 7).
- Każdy film z odpowiedzią AI: dopisek na ekranie lub w opisie „odpowiedź wygenerowana przez AI” i włączona etykieta treści AI, jeśli platforma jej wymaga.
- Pokazane odpowiedzi „Riposty” to przykłady napisane do scenariusza. Na nagraniu używaj faktycznej odpowiedzi z aplikacji (może się różnić); nie przerabiaj jej tak, żeby wyglądała lepiej, niż aplikacja zrobiła.
- Standardowy CTA, jeśli nie podano innego: **„Link w bio. 3 riposty gratis.”**

---

**1. „Ex pisze po roku” (seria, odc. 1)**
- Haczyk (tekst): *Ex napisał po roku. Daję to AI na poziomie pazura 5.*
- Sceny: telefon wibruje → zbliżenie na wiadomość → wklejasz do Riposty → suwak na 🔥 → odsłaniasz 3 odpowiedzi po kolei.
- Wiadomość: „Hej, dawno nie gadaliśmy. Często o Tobie myślę 🙂”
- Riposta (Z pazurem 🔥🔥🔥🔥): „Miło, że myślisz. Ja w tym czasie zdążyłam zmienić pracę, fryzurę i standardy.”
- Przewidywana reakcja: *Pisze… przestaje pisać… pisze… idzie na spacer.*
- CTA: „Część 2 jutro. Link w bio.”

**2. „Szef w niedzielę 22:00”**
- Haczyk: *Niedziela, 22:00. Szef: „Masz chwilę?”*
- Sceny: kanapa, serial, powiadomienie → mina „nie” → Riposta, poziom 2 → wybór stylu Elegancko.
- Wiadomość: „Masz chwilę? Trzeba by jeszcze dziś rzucić okiem na prezentację.”
- Riposta (Elegancko 🔥🔥): „Dobry wieczór! Przejrzę ją jutro o 8:00 jako pierwszą rzecz, żeby była gotowa przed spotkaniem.”
- Przewidywana reakcja: *Szef szanuje granice. Szef jeszcze o tym nie wie, ale szanuje.*
- CTA: „Uratuj swoją niedzielę. Link w bio.”

**3. „Co znaczy »ok.« z kropką?” (Dekoder)**
- Haczyk: *Napisała „ok.” Z KROPKĄ. Dekoder, ratuj.*
- Sceny: zrzut rozmowy (zamazane imię) → Dekoder → animowane odsłanianie: werdykt, poziom dramy, flagi.
- Wiadomość: „ok.”
- Dekoder: werdykt „To nie jest ok. To jest »ok.«”; poziom dramy 7/10; czerwona flaga: kropka; zielona flaga: w ogóle odpisała; rada: „Zapytaj wprost, co się stało, bez zgadywania.”
- CTA: „Wrzuć swoje »ok.« do Dekodera. Link w bio.”

**4. „Poziom pazura 1 vs 5”: teściowa**
- Haczyk: *Ta sama wiadomość od teściowej. Poziom 1 vs poziom 5.*
- Sceny: split screen, lewa strona 😇, prawa 🔥, odsłaniane jednocześnie.
- Wiadomość: „Kochanie, w tym roku święta znowu u nas, prawda? Bo u was za ciasno.”
- Riposta poziom 1 (Na luzie 🔥): „Jasne, chętnie przyjedziemy! Przywieziemy sernik.”
- Riposta poziom 5 (Z pazurem 🔥🔥🔥🔥🔥): „Za ciasno? To idealnie, w tym roku będzie kameralnie. Zapraszamy do nas na drugi dzień świąt.”
- Przewidywana reakcja: *Teściowa przelicza krzesła. I sojuszników.*
- CTA: „Który poziom wysyłasz? Pisz w komentarzu.”

**5. „Klient chce rabat”**
- Haczyk: *Klient: „A za gotówkę taniej?” Odpowiedź za 50 groszy.*
- Sceny: freelancer przy laptopie → wklejasz → styl Elegancko.
- Wiadomość: „Super oferta, ale czy da się zejść o 30%? Konkurencja robi taniej.”
- Riposta (Elegancko 🔥🔥🔥): „Rozumiem. Mogę zejść z ceny, jeśli zejdziemy z zakresu: bez dwóch rund poprawek wychodzi 20% mniej. Która wersja pasuje?”
- Przewidywana reakcja: *Klient wybiera pełną wersję i udaje, że to był jego pomysł.*
- CTA: „Freelancerze, link w bio.”

**6. POV: grupa rodzinna**
- Haczyk: *POV: ciocia oznaczyła cię na grupie rodzinnej o 6:40.*
- Sceny: budzik, zdjęcie z wiadomością w dymku, Riposta poziom 2.
- Wiadomość: „A kiedy wreszcie jakieś wnuki? 😉 Tylko pytam.”
- Riposta (Na luzie 🔥🔥): „Na razie mam kota i fikusa. Oboje przyjmują odwiedziny w niedziele 😄”
- Przewidywana reakcja: *Ciocia wysyła 4 emotki i zdjęcie fikusa sprzed 2009 roku.*
- CTA: „Rodzina pyta, Riposta odpowiada.”

**7. „Ex pisze po roku” (odc. 2)**
- Haczyk: *Część 2. Ex odpisał na moją ripostę.*
- Sceny: odegrany ciąg dalszy z odcinka 1 → nowa wiadomość → Riposta poziom 3.
- Wiadomość: „Haha, widzę, że dalej masz charakterek. Kawa w tym tygodniu?”
- Riposta (Elegancko 🔥🔥🔥): „Charakterek mam, czasu mniej. Powodzenia z kawą!”
- Przewidywana reakcja: *Sprawdza Twoje stories. Trzy razy.*
- CTA: „Obserwuj, część 3 w piątek.”

**8. Dekoder: „Zobaczymy”**
- Haczyk: *Zapytałem ją o randkę. Odpisała „zobaczymy”. Dekoder?*
- Sceny: zrzut → Dekoder → pasek dramy rośnie.
- Wiadomość: „zobaczymy 😊”
- Dekoder: werdykt „Uśmiech robi tu całą robotę. To miękkie »tak, ale postaraj się«”; dramy 3/10; zielona flaga: emotka; czerwona flaga: brak konkretu; rada: „Zaproponuj konkretny dzień i miejsce.”
- CTA: „Nie zgaduj. Dekoder w bio.”

**9. Stitch: „Jak odpisać na…”**
- Haczyk: *Stitchuję twoją wiadomość. Riposta odpisuje.*
- Sceny: stitch z filmem widza (tylko taki, który na to pozwala) → wklejasz cytat do Riposty → 3 style.
- Wiadomość: (z filmu widza, za zgodą) np. „Sorki, że nie odpisałem tydzień, byłem zajęty.”
- Riposta (Z pazurem 🔥🔥🔥🔥): „Spoko, ja też byłam zajęta. Tym tygodniem.”
- Przewidywana reakcja: *Nagle ma czas. Dużo czasu.*
- CTA: „Wrzuć swoją wiadomość w komentarzu, następny stitch może być twój.”

**10. „Szef: »Musimy porozmawiać«”**
- Haczyk: *Szef w piątek o 16:55: „Musimy porozmawiać w poniedziałek”.*
- Sceny: dramatyczne zbliżenie → Dekoder (dramy) → potem Riposta, poziom 1.
- Wiadomość: „Musimy porozmawiać w poniedziałek.”
- Dekoder: dramy 6/10, rada „Zapytaj spokojnie o temat, żeby się przygotować.”
- Riposta (Elegancko 🔥): „Jasne. Czy mogę wiedzieć, czego dotyczy rozmowa, żebym przygotował materiały?”
- Przewidywana reakcja: *Szef odpisuje „nic poważnego, budżet”. Weekend uratowany.*
- CTA: „Nie trać weekendu na zgadywanie.”

**11. „Poziom pazura 1 vs 5”: współlokator**
- Haczyk: *Współlokator i brudne naczynia. Poziom 1 vs 5.*
- Sceny: zlew pełen naczyń → split screen.
- Wiadomość: „Umyję jutro, obiecuję.”
- Poziom 1 (Na luzie 🔥): „Okej, dzięki! Jutro gotuję, więc będą potrzebne 🙂”
- Poziom 5 (Z pazurem 🔥🔥🔥🔥🔥): „Te naczynia słyszały to zdanie już w zeszły wtorek. Złożyły wniosek o azyl.”
- Przewidywana reakcja: *Zmywa od razu. W ciszy. Z godnością.*
- CTA: „Który wysyłasz?”

**12. „Randka odpisała po 3 dniach”**
- Haczyk: *Odpisała po 3 dniach: „hej, sorry, szalony tydzień”.*
- Sceny: kalendarz przeskakuje 3 dni → Riposta poziom 3.
- Wiadomość: „hej, sorry, szalony tydzień haha”
- Riposta (Na luzie 🔥🔥🔥): „Haha, znam to. Mam nadzieję, że przetrwałaś. To kiedy ten nieszalony?”
- Przewidywana reakcja: *Odpisuje w 4 minuty. Rekord sezonu.*
- CTA: „Link w bio, 3 riposty gratis.”

**13. „Teściowa i święta” (seria, odc. 1)**
- Haczyk: *Seria: Teściowa i święta. Dzień 1: pierogi.*
- Sceny: stół wigilijny w tle → wiadomość → poziom 2.
- Wiadomość: „Pierogi zrobię ja, bo ostatnio były trochę za twarde.”
- Riposta (Elegancko 🔥🔥): „Świetnie, Mamo! To ja zrobię barszcz, a pierogi oddaję w najlepsze ręce.”
- Przewidywana reakcja: *Teściowa nie wie, czy to komplement. Uznaje, że tak.*
- CTA: „Codziennie do świąt jedna wiadomość. Obserwuj.”

**14. Dekoder: „Jesteś słodki”**
- Haczyk: *Napisała „jesteś słodki”. Friendzone czy nie? Dekoder decyduje.*
- Sceny: napięcie, bęben → wynik.
- Wiadomość: „haha jesteś słodki”
- Dekoder: werdykt „Zależy od kontekstu: to może być flirt albo poklepanie po ramieniu”; dramy 4/10; zielona: „haha”; czerwona: brak pytania zwrotnego; rada: „Zaproponuj spotkanie, odpowiedź powie więcej niż analiza.”
- CTA: „Dekoder: 50 groszy mniej stresu.”

**15. „Klient nie płaci”**
- Haczyk: *Faktura 30 dni po terminie. Klient: „już zlecam przelew”.*
- Sceny: kalendarz, kawa → Riposta poziom 3, styl Elegancko.
- Wiadomość: „Już zlecam przelew, proszę o cierpliwość.”
- Riposta (Elegancko 🔥🔥🔥): „Dziękuję! Proszę o potwierdzenie przelewu do jutra do 12:00, wtedy zamknę sprawę bez naliczania odsetek.”
- Przewidywana reakcja: *Potwierdzenie przychodzi o 11:58.*
- CTA: „Uprzejmie, ale skutecznie. Link w bio.”

**16. POV: rodzic pisze jak telegram**
- Haczyk: *POV: tata pisze SMS-y jak telegram.*
- Wiadomość: „ZADZWOŃ. NIC SIĘ NIE STAŁO. TATA.”
- Riposta (Na luzie 🔥🔥): „Dzwonię za 10 min. Tato, Caps Lock nadal jest włączony 😄”
- Przewidywana reakcja: *Odpowiedź: „WIEM.”*
- CTA: „Oznacz kogoś, kto ma takiego tatę.”

**17. „Ex pisze po roku” (odc. 3, finał)**
- Haczyk: *Finał. Ex: „Mogę oddać Twoją bluzę?”*
- Wiadomość: „Mam jeszcze Twoją bluzę. Mogę podrzucić?”
- Riposta (Z pazurem 🔥🔥🔥🔥): „Zostaw ją pod drzwiami. Bluza wraca, ja nie.”
- Przewidywana reakcja: *Bluza pod drzwiami w 2 godziny. Z karteczką. Nieprzeczytaną.*
- CTA: „Chcesz sezon 2? Komentarz.”

**18. „3 style w 10 sekund” (demo produktu)**
- Haczyk: *Jedna wiadomość. 3 odpowiedzi. 10 sekund.*
- Sceny: nagranie ekranu z timerem, bez cięć.
- Wiadomość: „Wpadniesz w sobotę na moje urodziny?”
- Na luzie: „Jasne! Co przynieść oprócz siebie?” / Elegancko: „Z przyjemnością, dziękuję za zaproszenie!” / Z pazurem: „Wpadnę. Ale tort ma być lepszy niż w zeszłym roku 😏”
- CTA: „Sprawdź na swojej wiadomości, 3 gratis.”

**19. „Szef: »Na wczoraj«”**
- Haczyk: *Szef: „To jest na wczoraj”. Riposta: poziom 2.*
- Wiadomość: „Potrzebuję tego raportu na wczoraj.”
- Riposta (Elegancko 🔥🔥): „Rozumiem pilność. Wczoraj już minęło, ale dziś do 15:00 mogę oddać pełną wersję. Pasuje?”
- Przewidywana reakcja: *Szef odpisuje „pasuje” i dodaje emotkę kciuka. Pierwszy raz w historii.*
- CTA: „Link w bio.”

**20. Duet: „Reaguję na riposty AI”**
- Haczyk: *Czy AI jest lepsze w odpisywaniu niż ja?*
- Sceny: duet z własnym wcześniejszym filmem; po lewej Twoja odpowiedź, po prawej Riposty; ankieta w komentarzach.
- Wiadomość: „Nie gniewaj się, ale nie dam rady dziś przyjść.”
- Moja: „ok” / Riposta (Na luzie 🔥🔥): „Spoko, zdarza się. To w czwartek, ale Ty stawiasz kawę 😉”
- CTA: „Kto wygrał? Ja czy AI?”

**21. Dekoder: „Jesteś zły?”**
- Haczyk: *„Nie, nie jestem zły.” Dekoder, sprawdzisz?*
- Wiadomość: „Nie jestem zły. Rób jak chcesz.”
- Dekoder: werdykt „»Rób jak chcesz« to klasyczne »nie rób tak«”; dramy 8/10; czerwone: „rób jak chcesz”, krótkie zdania; zielona: komunikuje się; rada: „Zadzwoń zamiast pisać.”
- CTA: „Dekoder w bio.”

**22. „Teściowa i święta” (odc. 2): prezenty**
- Haczyk: *Teściowa: „Nie kupujcie mi nic”. Pułapka?*
- Wiadomość: „Nic mi nie kupujcie, ja niczego nie potrzebuję.”
- Riposta (Na luzie 🔥🔥): „Dobrze, Mamo! W takim razie dostanie Mama »nic« w bardzo ładnym pudełku z kokardą 🎁”
- Przewidywana reakcja: *Teściowa się śmieje. I jednak podaje rozmiar szalika.*
- CTA: „Codziennie do świąt.”

**23. „Poziom pazura 1 vs 5”: spóźniający się kolega**
- Haczyk: *„Będę za 5 minut” (od 40 minut). Poziom 1 vs 5.*
- Poziom 1 (🔥): „Spoko, czekam przy wejściu!”
- Poziom 5 (🔥🔥🔥🔥🔥): „Twoje 5 minut trwa dłużej niż mój ostatni związek. Zamawiam bez Ciebie.”
- Przewidywana reakcja: *Biegnie. Pierwszy raz od podstawówki.*
- CTA: „Oznacz tego kolegę.”

**24. „Wyzwanie: Poziom pazura 5”**
- Haczyk: *Wyzwanie: wyślij ripostę na poziomie 5 i pokaż reakcję.*
- Sceny: objaśnienie zasad (zamazujesz imiona i zdjęcia, wysyłasz tylko komuś, kto zna się na żartach), przykład z naszą wiadomością.
- Wiadomość: „Kto zjadł mój jogurt z lodówki?”
- Riposta (Z pazurem 🔥🔥🔥🔥🔥): „Jogurt odszedł tak, jak żył: bez etykiety z imieniem.”
- CTA: „Oznacz #poziompazura5. Tylko dla ludzi z poczuciem humoru.”

**25. „Klient: »Zrobi Pan to szybko, to 5 minut«”**
- Haczyk: *Klient: „To dla Pana 5 minut roboty”.*
- Wiadomość: „To dla Pana 5 minut, więc chyba bez faktury?”
- Riposta (Elegancko 🔥🔥🔥): „Pięć minut pracy, dziesięć lat doświadczenia. Faktura będzie, ale krótka 🙂”
- Przewidywana reakcja: *Klient płaci i poleca znajomemu. Który też zapyta o 5 minut.*
- CTA: „Dla freelancerów i firm, link w bio.”

**26. POV: grupa ze szkoły rodziców**
- Haczyk: *POV: grupa rodziców z klasy, 47 nieprzeczytanych.*
- Wiadomość: „Kto zbiera na prezent dla pani? Każdy po 50 zł, termin do jutra!”
- Riposta (Elegancko 🔥🔥): „Dziękuję za organizację! Dorzucę się, proszę tylko o numer konta i listę, kto już wpłacił.”
- Przewidywana reakcja: *Nagle wszyscy proszą o tę listę.*
- CTA: „Oszczędź sobie 20 minut pisania.”

**27. Zrzut ekranu zamiast wklejania (funkcja)**
- Haczyk: *Nie musisz nic przepisywać. Wrzucasz screena.*
- Sceny: zrzut odegranej rozmowy (fikcyjne imiona) → upload → Riposta czyta ostatnią wiadomość.
- Wiadomość (na zrzucie): „No i co, idziesz w końcu na tę imprezę czy znowu się wykręcisz?”
- Riposta (Na luzie 🔥🔥): „Idę. Ale jeśli będzie nudno, to oficjalnie Twoja wina 😄”
- CTA: „Screen → riposta. Link w bio.”

**28. „Ile kosztuje dobra odpowiedź?” (cena)**
- Haczyk: *Guma do żucia czy idealna odpowiedź do ex?*
- Sceny: na stole guma i telefon → obie rzeczy w tej samej cenie (sprawdź aktualną cenę gumy, zanim powiesz porównanie; inaczej powiedz „mniej niż kawa z automatu”, jeśli to prawda).
- Pokaz: portfel, pakiety 10 za 5 zł, 20 za 9 zł, 50 za 20 zł; 3 gratis na start.
- CTA: „Pierwsze 3 za darmo, dalej 50 groszy.”

**29. „Polecasz kumplowi = oboje +5” (polecenia)**
- Haczyk: *Masz kumpla, który nie umie odpisywać? Zrób mu przysługę.*
- Sceny: dwóch znajomych, jeden wysyła link `?ref=`, obaj widzą +5 ripost.
- Wiadomość (od kumpla): „Stary, co mam jej odpisać, ona napisała »hmm«”
- Riposta (Na luzie 🔥🔥): „Hmm to nie wyrok. Napisz: »Hmm brzmi jak ktoś, kto potrzebuje kawy. Jutro o 17?«”
- CTA: „Wyślij link, oboje macie +5.”

**30. Seria „Wasze wiadomości” (komentarze widzów)**
- Haczyk: *Najczęstsza wiadomość z waszych komentarzy. Riposta odpowiada.*
- Sceny: zrzut komentarza (nick zamazany, jeśli autor nie zgodził się na pokazanie) → Riposta, 3 style.
- Wiadomość: „Możemy zostać przyjaciółmi?”
- Riposta (Elegancko 🔥🔥🔥): „Doceniam szczerość. Daj mi trochę czasu, a potem zobaczymy, czy umiem być tylko przyjacielem.”
- Przewidywana reakcja: *Szanuje. Trochę żałuje.*
- CTA: „Wrzuć swoją w komentarzu, zrobimy jutro.”

---

## 4. 20 gotowych opisów z hashtagami

Hashtagi: mieszaj 3-6 na post; szerokie (#fyp, #dlaciebie) + tematyczne (#randki, #praca) + własne (#riposta, #poziompazura5). Własne tagi to nasz wymysł; zasięg pozostałych zmienia się i warto go sprawdzić w wyszukiwarce platformy przed użyciem.

1. Ex pisze po roku. Ja mam ripostę za 50 groszy 😏 Część 2 jutro. #riposta #ex #rozstanie #dlaciebie #fyp
2. Niedziela, 22:00, szef. Odpisałam tak, że weekend przetrwał 🛋️ #praca #szef #korpo #riposta #fyp
3. „ok.” z kropką. Dekoder mówi: dramy 7/10 😬 #randki #związek #ok #dekoder #riposta
4. Teściowa vs poziom pazura 5. Który wysyłasz? 🎄 #teściowa #święta #rodzina #humor #riposta
5. Klient chce 30% rabatu. Odpowiedź, po której nie trzeba się kłócić 💼 #freelancer #klient #biznes #riposta
6. Ciocia o 6:40 na grupie rodzinnej. Fikus pozdrawia 🌿 #rodzina #grupa #humor #dlaciebie #riposta
7. Jedna wiadomość, 3 style, 10 sekund. Na luzie, elegancko czy z pazurem? #ai #riposta #fyp #co_odpisać
8. „zobaczymy 😊” to tak czy nie? Dekoder rozstrzyga 🔍 #randki #flirt #dekoder #riposta #dlaciebie
9. Przysłałeś wiadomość, odpisuję stitchem. Następna może być Twoja 👇 #stitch #riposta #pomocy #fyp
10. Współlokator i naczynia. Poziom 1 vs 5 🍽️ #współlokator #mieszkanie #humor #riposta
11. Odpisała po 3 dniach. Ja w 10 sekund (z pomocą AI) ⏱️ #randki #ghosting #riposta #fyp
12. Seria: Teściowa i święta, dzień 1. Pierogi 🥟 #święta #teściowa #wigilia #riposta #rodzina
13. „Jesteś słodki”: friendzone czy flirt? 🤔 #friendzone #randki #dekoder #riposta
14. Faktura po terminie? Uprzejmie, ale skutecznie 💸 #faktura #freelancer #jdg #riposta
15. Tata pisze Caps Lockiem. Oznacz swojego 😄 #tata #rodzice #humor #riposta #dlaciebie
16. Wyzwanie #poziompazura5: najostrzejsza riposta, zero chamstwa. Dasz radę? 🔥 #wyzwanie #riposta #fyp
17. Nie przepisuj. Wrzuć screena, Riposta przeczyta rozmowę 📱 #ai #aplikacja #riposta #lifehack
18. 3 riposty gratis, potem 50 groszy. Mniej niż stres nad jedną wiadomością 🪙 #riposta #ai #oszczędzanie
19. Kumpel nie umie odpisywać? Wyślij mu link, oboje macie +5 🤝 #przyjaciele #riposta #polecam
20. „Możemy zostać przyjaciółmi?” Najczęstsza wiadomość z Waszych komentarzy 💔 #friendzone #rozstanie #riposta #dlaciebie

Do każdego opisu z odpowiedzią AI dodaj na końcu: **„Odpowiedź wygenerowana przez AI (Riposta).”**

---

## 5. Mikroinfluencerzy (10-50 tys. obserwujących)

Przed wysłaniem: sprawdź, czy publiczność twórcy jest pełnoletnia (szczególnie przy randkach), czy twórca oznacza współpracę jako reklamę i czy nie ma w treściach mowy nienawiści. Każdy twórca dostaje własny kod polecający (`?ref=KOD`), więc rozliczenie jest przejrzyste.

### Szablon 1: randki i związki

> Cześć [imię]! Oglądam Twoje filmy o randkach, szczególnie [konkretny film]. Robię Ripostę: wklejasz wiadomość, na którą nie wiesz, jak odpisać (albo screena), i dostajesz 3 gotowe odpowiedzi z poziomem pazura od 😇 do 🔥. Jest też Dekoder: „co on/ona miał(a) na myśli?”.
>
> Propozycja: dam Ci darmowe riposty do testów i Twój własny kod. Każdy, kto wejdzie z Twojego linku, dostaje +5 ripost na start. [Tu wpisz warunki: stawka za film / prowizja od doładowań / tylko barter.] Zero gotowego scenariusza, mów po swojemu; jedyna prośba to oznaczenie współpracy jako reklamy i informacja, że odpowiedzi tworzy AI.
>
> Dasz znać, czy Cię to ciekawi? Mogę wysłać przykład na Twojej wiadomości.

### Szablon 2: praca, kariera, freelancing

> Dzień dobry [imię], Twoje treści o [korpo / freelancingu / rozmowach z szefem] są bardzo konkretne. Robię narzędzie Riposta: pomaga odpisać szefowi w niedzielę, klientowi, który chce rabat, albo komuś, kto nie płaci faktury. 3 style odpowiedzi, wybierasz ton od uprzejmego do stanowczego.
>
> Chętnie dam Ci dostęp do testów i Twój kod polecający (+5 ripost dla każdego, kto przyjdzie przez Twój link). [Warunki współpracy.] Pełna swoboda w formie, prośba tylko o oznaczenie reklamy i informację o AI.
>
> Jeśli to brzmi sensownie, wyślę 2-3 przykłady na typowych wiadomościach z Twojej branży.

### Szablon 3: humor

> Hej [imię]! Twój film [tytuł/temat] rozwalił mnie totalnie. Robię Ripostę, apkę, która odpisuje za Ciebie na poziomie pazura od „anioł” do „bez litości”, a przy każdej odpowiedzi daje „przewidywaną reakcję” drugiej strony. Wydaje mi się, że to pasuje do Twoich formatów (np. „poziom 1 vs poziom 5”).
>
> Mogę dać darmowe riposty na nagrania i Twój własny kod (+5 ripost dla widzów). [Warunki.] Humor bez obrażania kogokolwiek, oznaczona reklama, info o AI, reszta po Twojemu.
>
> Wchodzisz?

### Tabela śledzenia współprac (szablon)

| Twórca | Platforma | Obserwujący | Nisza | Data kontaktu | Odpowiedź | Warunki | Kod ref | Data publikacji | Link do filmu | Wyświetlenia | Wejścia (UTM) | Nowi użytkownicy z kodu | Doładowania z kodu | Koszt | Uwagi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| @przyklad | TikTok | | randki | | czeka / tak / nie | | | | | | | | | | 18+? oznaczenie reklamy? |

Kolumny „Nowi użytkownicy z kodu” i „Doładowania z kodu” wypełniaj wyłącznie z własnych danych (kody poleceń + UTM), nie z deklaracji twórcy.

---

## 6. Teksty na stronę (SEO)

**Title tag (do ~60 znaków):**
- `Riposta – co odpisać? Idealna odpowiedź w 10 sekund`
- wariant: `Co odpisać ex, szefowi, randce? Riposta AI za 50 gr`

**Meta description (do ~155 znaków):**
- `Nie wiesz, co odpisać? Wklej wiadomość lub screena, ustaw poziom pazura i dostań 3 gotowe odpowiedzi. 3 riposty gratis, potem 50 groszy.`

**Opcje H1:**
1. Nie wiesz, co odpisać? 50 groszy i masz idealną odpowiedź.
2. Co odpisać? Wklej wiadomość, Riposta zrobi resztę.
3. Idealna odpowiedź na każdą wiadomość: od ex, szefa i teściowej.

### FAQ (pod frazy, które ludzie wpisują)

**Co odpisać ex, który pisze po długiej przerwie?**
To zależy, czego chcesz: zamknąć temat, zostać w kontakcie czy po prostu odpowiedzieć z klasą. Wklej wiadomość do Riposty, wybierz cel i poziom pazura, a dostaniesz trzy wersje: na luzie, elegancko i z pazurem. Ostatnie słowo i tak należy do Ciebie.

**Jak odpisać szefowi po godzinach albo w weekend?**
Najlepiej uprzejmie i z konkretnym terminem, kiedy się tym zajmiesz. Riposta podpowie odpowiedź, która chroni Twój czas wolny, a jednocześnie brzmi profesjonalnie. Ustaw niski poziom pazura i wybierz styl „Elegancko”.

**Co znaczy „ok” od dziewczyny (albo od chłopaka)?**
„ok” może znaczyć zgodę, zmęczenie albo urazę; dużo zależy od kontekstu, kropki i emotek. Dekoder Riposty analizuje wiadomość i podaje werdykt, poziom dramy, czerwone i zielone flagi oraz radę, co zrobić dalej. To podpowiedź, a nie wyrocznia, więc jeśli coś jest niejasne, zapytaj wprost.

**Jak odpisać klientowi, który chce rabat?**
Zamiast tłumaczyć się z ceny, zaproponuj zmianę zakresu albo pokaż wartość. Riposta przygotuje uprzejmą, stanowczą odpowiedź w kilku wariantach.

**Co odpisać teściowej, żeby nie było awantury?**
Ciepło, z humorem i z jasną granicą. Ustaw poziom pazura 1-2 i wybierz styl „Na luzie” albo „Elegancko”. Poziom 5 zostaw na wiadomości, przy których wiesz, że druga strona zrozumie żart.

**Jak odpisać na wiadomość, kiedy nie wiem, co napisać?**
Wklej ją do Riposty albo wrzuć zrzut ekranu rozmowy. W kilka sekund dostaniesz trzy gotowe odpowiedzi z oceną mocy 🔥 i przewidywaną reakcją drugiej strony. Możesz je skopiować i poprawić po swojemu.

**Ile kosztuje Riposta?**
Na start masz 3 riposty gratis. Potem jedna riposta lub analiza Dekoderem kosztuje 0,50 zł z portfela. Portfel doładowujesz pakietem: 10 ripost za 5 zł, 20 za 9 zł albo 50 za 20 zł. Za polecenie znajomemu oboje dostajecie +5 ripost.

**Czy moje wiadomości są gdzieś zapisywane?**
Treść wiadomości nie jest zapisywana ani logowana; służy tylko do wygenerowania odpowiedzi. Mimo to nie wklejaj danych, których nie musisz (numerów kont, adresów, haseł). Szczegóły w polityce prywatności.

*(Uwaga: sprawdź tę odpowiedź z aktualną polityką prywatności przed publikacją; po przeglądzie prawnym musi się z nią zgadzać.)*

---

## 7. Czego NIE robimy

**Uczciwość**
- Żadnych fałszywych opinii, recenzji ani „świadectw użytkowników”. Cytujemy prawdziwego użytkownika tylko za jego pisemną zgodą.
- Żadnych wymyślonych liczb: „10 000 osób już używa”, „98% zadowolonych”, „odpisała w minutę” jako fakt. Liczby z tego dokumentu to założenia/cele i zostają wewnętrzne.
- Scenki odgrywane przedstawiamy jako scenki, nie jako prawdziwe historie. Nie przerabiamy odpowiedzi AI tak, by wyglądała lepiej, niż aplikacja ją wygenerowała.
- Nie obiecujemy efektów („odzyskasz ex”, „dostaniesz podwyżkę”).

**Osoby i marki**
- Nie podszywamy się pod prawdziwe osoby, celebrytów, influencerów ani marki. Żadnych ich nazwisk, logotypów, głosów (także klonowanych AI) ani wiadomości „od” nich.
- Nie używamy cudzych filmów bez zgody; stitch/duet tylko tam, gdzie twórca na to pozwala.
- Bez nawiązań do konkretnych firm (np. „szef z [prawdziwa firma]”).

**AI**
- Oznaczamy, że odpowiedzi tworzy AI (tekst na ekranie lub w opisie + etykieta treści AI tam, gdzie platforma jej wymaga).
- Twórcy w współpracach oznaczają reklamę zgodnie z zasadami platformy i polskimi przepisami (oznaczenie współpracy płatnej / barterowej).

**Wiek i reklamy**
- Treści randkowe i płatne promocje kierujemy wyłącznie do osób 18+.
- Nie celujemy reklam do niepełnoletnich; przestrzegamy zasad reklamowych TikToka, Meta i YouTube (m.in. dotyczących randek i targetowania młodzieży).
- Nie zachęcamy do wysyłania ostrych wiadomości nauczycielom, rodzicom czy osobom, które mogłyby się poczuć zaatakowane; wyzwanie #poziompazura5 jest tylko dla ludzi, którzy rozumieją żart.

**Prywatność**
- Na prawdziwych zrzutach zamazujemy imiona, zdjęcia profilowe, numery telefonów i wszystko, po czym można kogoś rozpoznać.
- Wiadomości od widzów publikujemy tylko za ich zgodą, a jeśli w wiadomości jest trzecia osoba, usuwamy wszelkie dane identyfikujące.
- Nie zbieramy danych z komentarzy ani DM-ów do innych celów niż odpowiedź.

**Ton**
- Pazur tak, chamstwo nie. Nigdy żartów z wyglądu, pochodzenia, zdrowia, wieku, wyznania, orientacji ani niepełnosprawności.
- Zero wulgaryzmów, zero nękania, zero treści, które pomagają kogoś zastraszyć, ośmieszyć publicznie albo manipulować.
- Tematy przemocy, rozstań w trudnych okolicznościach czy zdrowia psychicznego omijamy w formacie żartu.
