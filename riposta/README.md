# Riposta

**Nie wiesz, co odpisać? 50 groszy i masz idealną odpowiedź.**

Wklejasz wiadomość od ex, szefa, randki albo teściowej, ustawiasz „poziom pazura” i dostajesz 3 gotowe odpowiedzi
(na luzie, elegancko, z pazurem) z oceną mocy 🔥 i przewidywaną reakcją drugiej strony.

- Pomysł i prompt: [PROMPT.md](PROMPT.md)
- Plan biznesowy i liczby: [BIZNES.md](BIZNES.md)

## Uruchomienie lokalnie

```bash
cd riposta
npm install
npm run dev        # AI i płatności w trybie testowym, bez żadnych kluczy
# otwórz http://localhost:3000
```

Z prawdziwym AI:

```bash
cp .env.example .env
# wpisz ANTHROPIC_API_KEY=... w .env
npm start
```

Testy: `npm test`

## Co jest gotowe

| Część | Stan |
|---|---|
| Strona z generatorem ripost, 8 typów nadawców, cel, poziom pazura 1-5 | ✅ |
| AI: Claude przez oficjalne SDK, odpowiedź w sztywnym formacie JSON, automatyczny model zastępczy przy odmowie | ✅ |
| Portfel: 3 riposty gratis, potem 0,50 zł z portfela; przy błędzie AI opłata wraca | ✅ |
| Pakiety: 10 za 5 zł, 20 za 9 zł, 50 za 20 zł | ✅ |
| Płatności: wspólny interfejs + testowy bank BLIK | ✅ |
| Przelewy24 i Stripe: kod gotowy, czeka na klucze | ⏳ do podpięcia |
| Program poleceń: kod, link `?ref=`, +5 ripost dla obu stron | ✅ |
| Obrazek do social media z ripostą i znakiem wodnym | ✅ |
| Regulamin i polityka prywatności (projekty z polami do uzupełnienia) | ⏳ do sprawdzenia przez prawnika |
| Limit zapytań, ochrona przed path traversal, nagłówki bezpieczeństwa (CSP) | ✅ |
| Prywatność: treść wiadomości nie jest nigdzie zapisywana ani logowana | ✅ |
| Dockerfile | ✅ |

### Animacje i śmieszne rzeczy

- Telefon w nagłówku sam „pisze” przykładowe riposty (ex, szef, teściowa, randka, klient).
- Moneta 50 gr leci do portfela przy każdej płatnej ripoście; przy doładowaniu sypie się deszcz monet, a saldo odlicza się na żywo.
- Kropki „pisze…” i zabawne teksty w trakcie czekania („Konsultuję z babcią…”, „Pytam kota o zdanie… kot ma to gdzieś.”).
- Poziom pazura z minami 😇🙂😏😈🔥; na poziomie 5 ramka się trzęsie.
- Pasek mocy 🔥 i „przewidywana reakcja” przy każdej odpowiedzi.
- Konfetti przy kopiowaniu.
- 9 osiągnięć (Pierwsza riposta, Nocny Marek, Odwaga roku za teściową, Pracoholik za szefa w weekend…).
- Easter eggi: kod Konami (↑↑↓↓←→←→BA) włącza tryb disco; 5 kliknięć w logo; wpisanie „teściowa” przy innym nadawcy.
- Strona 404 z charakterem i udawany bank z tekstem „Bank pyta kota o zgodę…”.
- Wszystkie animacje wyłączają się przy systemowym ustawieniu „ogranicz ruch”.

## Podpięcie płatności (na końcu)

Portfel jest doładowywany **tylko** po zweryfikowanym powiadomieniu (webhooku) od bramki, nigdy na podstawie powrotu użytkownika na stronę.

### Przelewy24 (BLIK, przelewy, karty)

1. Załóż konto firmowe na przelewy24.pl i przejdź weryfikację.
2. W panelu skopiuj: ID sprzedawcy, ID sklepu (POS), klucz API (do raportów/REST) i klucz CRC.
3. W `.env`: `PAYMENT_PROVIDER=przelewy24`, `P24_MERCHANT_ID`, `P24_POS_ID`, `P24_API_KEY`, `P24_CRC`, `P24_SANDBOX=true`.
4. Ustaw `PUBLIC_URL` na publiczny adres HTTPS (powiadomienia trafiają na `PUBLIC_URL/api/payments/przelewy24/webhook`).
5. Zrób testową płatność w sandboksie, potem `P24_SANDBOX=false`.

Przelewy24 wymaga e-maila płacącego, więc formularz doładowania sam pokaże pole na e-mail.
Kod: `server/payments/przelewy24.js` (rejestracja transakcji, sprawdzenie podpisu powiadomienia, kwoty i obowiązkowe `transaction/verify`).
Przed startem porównaj go z aktualną dokumentacją Przelewy24.

### Stripe (karty, BLIK, P24, Apple/Google Pay)

1. W panelu Stripe włącz metody BLIK i Przelewy24 dla PLN.
2. Dodaj webhook `PUBLIC_URL/api/payments/stripe/webhook` ze zdarzeniem `checkout.session.completed`.
3. W `.env`: `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

Kod: `server/payments/stripe.js` (Checkout Session przez REST i ręczna weryfikacja podpisu `Stripe-Signature`).

### Checklista przed startem

- [ ] Dane firmy w `public/regulamin.html` i `public/prywatnosc.html` (żółte pola) i przegląd przez prawnika.
- [ ] Paragony/faktury: integracja z systemem fakturowym albo kasą online (na razie brak).
- [ ] Hosting z HTTPS i trwałym dyskiem na `DATA_FILE` (albo zamiana `server/store.js` na Postgres przy większym ruchu).
- [ ] Sprawdzić koszt AI na prawdziwym ruchu (logi `ev: "riposta"` zawierają liczbę tokenów).
- [ ] Riposta+ (abonament 19 zł/mies.) wymaga płatności cyklicznych; jeszcze niezrobione.

## Architektura

```
riposta/
  server/
    server.js        # HTTP (bez frameworka): API, pliki statyczne, nagłówki bezpieczeństwa
    ai.js            # Claude: prompt, schemat odpowiedzi, tryb testowy
    store.js         # baza w pliku JSON (zapisy atomowe)
    config.js        # cennik, pakiety, zmienne środowiskowe
    payments/        # mock.js, przelewy24.js, stripe.js + wspólny interfejs
  public/            # strona: index.html, app.js, styles.css, regulamin, prywatność, testowy bank
  test/              # testy API (node --test)
```

API (pełny kontrakt: [docs/API.md](docs/API.md)):

| Metoda i adres | Co robi |
|---|---|
| `GET /api/config` | cennik, pakiety, nadawcy, `features`, `dekoderPriceGr`, `maxImageBytes` |
| `GET /api/me` | portfel i statystyki użytkownika (ciasteczko `rid`) |
| `POST /api/riposta` | 3 riposty; `message` albo zrzut ekranu `image: { mediaType, data }` (JPG/PNG/WebP, do 1,5 MB) |
| `POST /api/dekoder` | „Co on/ona miał(a) na myśli?”: analiza wiadomości, cena i rozliczenie jak riposta |
| `GET /api/wallet/code` | tajny kod portfela `RIP-XXXX-XXXX-XXXX` (do przeniesienia na inny telefon) |
| `POST /api/wallet/code/rotate` | nowy kod, stary przestaje działać |
| `POST /api/wallet/restore` | przywrócenie portfela kodem (limit 5 prób/min na IP) |
| `GET /api/admin/stats` | panel właściciela, `Authorization: Bearer <ADMIN_TOKEN>`; bez tokenu w env: 404 |
| `POST /api/topup`, `GET /api/payments/:id`, `POST /api/payments/:provider/webhook` | doładowania |
| `POST /api/referral` | kod polecający |
| `GET /healthz` | healthcheck |

Limit body: 2,5 MB dla `/api/riposta` i `/api/dekoder` (zrzuty ekranu), 16 KB dla pozostałych tras.
Zrzuty ekranu idą prosto do Claude i nie są nigdzie zapisywane ani logowane (tak samo jak treść wiadomości).
Statystyki w panelu są wyłącznie zagregowanymi licznikami (dzień, poziom pazura, nadawca).

Zmienne środowiskowe poza AI i płatnościami: `ADMIN_TOKEN` (panel właściciela), `TRUST_PROXY=true`
(za reverse proxy: IP klienta z `X-Forwarded-For`, ważne dla limitów), `RATE_LIMIT_PER_MINUTE`, `DATA_FILE`.

Ten sam `public/` działa też jako podgląd na claude.ai: `app.js` sam wykrywa, że jest w artefakcie,
i wtedy używa AI z konta Claude oraz symulowanego portfela w przeglądarce.
