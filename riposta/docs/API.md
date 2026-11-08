# Riposta API: kontrakt (wersja 2)

Wszystkie odpowiedzi to JSON. Błędy: `{ "error": "<kod>", "message": "<tekst po polsku dla użytkownika>" }`.
Użytkownik jest rozpoznawany po ciasteczku `rid` (HttpOnly). Ceny w groszach.

## Obiekt `me`

```json
{
  "balanceGr": 950, "freeLeft": 0, "ripostesLeft": 19,
  "referralCode": "K7XQ2M", "referredBy": false,
  "stats": { "ripostes": 4, "dekoder": 1, "spentGr": 100, "maxSpice": 5 }
}
```

## Istniejące (bez zmian w zachowaniu)

- `GET /api/config` → dodatkowo: `"features": { "images": true, "dekoder": true, "walletCode": true }`, `"dekoderPriceGr": 50`, `"maxImageBytes": 1572864`
- `GET /api/me` → `me`
- `POST /api/topup`, `GET /api/payments/:id`, `POST /api/payments/:provider/webhook`, `POST /api/referral` → bez zmian
- `GET /healthz`

## NOWE / ZMIENIONE

### `POST /api/riposta` (rozszerzone o zrzut ekranu)

Body:
```json
{ "who": "Ex", "goal": "", "message": "tekst (opcjonalny, jeśli jest image)", "spice": 3,
  "image": { "mediaType": "image/jpeg", "data": "<base64 bez prefiksu data:>" } }
```
- `image` opcjonalne. Dozwolone `mediaType`: `image/jpeg`, `image/png`, `image/webp`. Po zdekodowaniu max 1,5 MB (`maxImageBytes`).
- Wymagane: niepusty `message` ALBO `image`. Gdy jest tylko obraz, AI odczytuje rozmowę ze zrzutu i odpowiada na ostatnią wiadomość drugiej strony.
- Limit rozmiaru body dla tej trasy: 2,5 MB (inne trasy zostają przy 16 KB).
- Odpowiedź 200 bez zmian: `{ "replies": [{ "styl", "tekst", "ogien", "reakcja" }], "paidWith": "free"|"wallet", "me" }`.
- Błędy jak dotąd + `400 bad_image` ("Obsługujemy zdjęcia JPG, PNG i WebP do 1,5 MB.").

### `POST /api/dekoder` (nowy produkt: „Co on/ona miał(a) na myśli?”)

Body: `{ "who": "Randka", "message": "ok.", "image": { ... opcjonalnie } }`
Cena i rozliczenie jak riposta (najpierw darmowe, potem 50 gr z portfela, zwrot przy błędzie AI).
Odpowiedź 200:
```json
{
  "analysis": {
    "werdykt": "Krótki, zabawny werdykt w 1 zdaniu",
    "znaczenie": "Co ta wiadomość naprawdę znaczy (2-3 zdania)",
    "poziomDramy": 7,
    "nastroj": "obrażona | znudzony | flirtuje | zestresowany | ... (1-2 słowa)",
    "czerwoneFlagi": ["..."],
    "zieloneFlagi": ["..."],
    "rada": "Jedno zdanie: co zrobić / jak odpisać"
  },
  "paidWith": "free",
  "me": { ... }
}
```
UWAGA: klucz rady to `"rada"` (zwykłe ASCII). `czerwoneFlagi` i `zieloneFlagi` mają 0-3 elementy. `poziomDramy` 1-10.

### Przenoszenie portfela na inny telefon

- `GET /api/wallet/code` → `{ "code": "RIP-ABCD-EFGH-JKLM" }` — tajny kod portfela (tworzony przy pierwszym wywołaniu, 12 znaków z alfabetu bez 0/O/1/I).
- `POST /api/wallet/code/rotate` → `{ "code": "RIP-...." }` — nowy kod, stary przestaje działać.
- `POST /api/wallet/restore` body `{ "code": "RIP-ABCD-EFGH-JKLM" }` (wielkość liter i myślniki bez znaczenia) →
  200 `{ "me": { ... } }` + ustawia ciasteczko `rid` na ten portfel.
  404 `bad_code` ("Nie ma portfela z takim kodem."). Limit: 5 prób na minutę na IP → 429.

### Panel właściciela

- `GET /api/admin/stats` z nagłówkiem `Authorization: Bearer <ADMIN_TOKEN>` (zmienna środowiskowa; gdy pusta → 404).
  Zły token → 401. Odpowiedź:
```json
{
  "users": 120, "ripostes": 840, "dekoder": 130, "freeUsed": 300,
  "paymentsPaid": 31, "revenueGr": 27900,
  "days": [ { "date": "2026-11-08", "ripostes": 40, "dekoder": 6, "newUsers": 9, "revenueGr": 1800 } ],
  "bySpice": { "1": 20, "2": 80, "3": 400, "4": 200, "5": 140 },
  "byWho": { "Ex": 300, "Szef": 120 },
  "aiErrors": 3
}
```
  `days` = ostatnie 30 dni (najstarszy pierwszy, dni bez ruchu też, z zerami). Statystyki są zagregowane, bez treści wiadomości.

## Pliki statyczne

Serwer serwuje wszystko z `public/` (również `manifest.webmanifest`, `sw.js`, `robots.txt`, `sitemap.xml`, `og.png`, `admin.html`).
`sw.js` musi być serwowany z nagłówkiem `Service-Worker-Allowed: /` i `Cache-Control: no-cache`.
CSP zostaje restrykcyjna (bez inline JS/CSS); dodaj `manifest-src 'self'; worker-src 'self'`.
