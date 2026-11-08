# Prompty, którymi zbudowałem wersję 2

Rundę 2 robiły równolegle trzy agenty. Każdy dostał tylko swoje pliki, żeby nie wchodzić sobie w drogę.
Wspólny kontrakt: [API.md](API.md). Na koniec: przegląd kodu skillem `code-review`, testy i test w przeglądarce.

## Agent 1: backend

> Rozbuduj serwer Riposty (Node, bez frameworka) w `riposta/server/` i testy w `riposta/test/` zgodnie z `riposta/docs/API.md`:
> zrzuty ekranu (Claude vision) w `/api/riposta`, nowy produkt `/api/dekoder`, kod przenoszenia portfela,
> panel statystyk `/api/admin/stats` za tokenem, liczniki dzienne bez treści wiadomości, PWA (nagłówki `sw.js`, CSP).
> Nie ruszaj `public/`. Wszystkie testy muszą przechodzić.

## Agent 2: frontend

> Rozbuduj stronę w `riposta/public/` zgodnie z `riposta/docs/API.md`: zakładki Riposta/Dekoder, zrzut ekranu
> (wklej, przeciągnij, wybierz; zmniejszanie w przeglądarce), historia ostatnich ripost (tylko w przeglądarce),
> okno „Mój portfel” z kodem przenoszenia, PWA (manifest, service worker, ikony), obrazek OG, robots/sitemap,
> panel właściciela `admin.html` z wykresami (skill `dataviz`). Ten sam kod ma działać jako artefakt na claude.ai.
> Nie ruszaj `server/`.

## Agent 3: marketing

> Napisz `riposta/MARKETING.md`: plan startu na 30 dni, 30 scenariuszy TikToków/Reelsów (hak, przebieg, tekst na ekranie,
> CTA), 20 podpisów i hashtagów, wiadomości do mikroinfluencerów, teksty na stronę (SEO). Bez zmyślonych opinii klientów
> i bez zmyślonych liczb.
