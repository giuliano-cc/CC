# PrintFlow — Frontend

Frontend SaaS multi-utente per creare, gestire e stampare layout personalizzati
(fatture, report, CV) tramite un editor visuale drag-and-drop. Progetto
"production-ready" nel frontend: nessun backend è incluso, ma tutto è già
predisposto per collegarsi a una vera API RESTful (autenticazione JWT,
gestione errori 401/403, variabili d'ambiente).

## Stack

- Vite + React (JSX)
- TailwindCSS
- react-router-dom
- @dnd-kit (core, sortable, utilities) per il drag-and-drop
- axios (con interceptor per JWT e gestione errori)
- react-hot-toast, lucide-react

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Variabili d'ambiente (`.env`):

- `VITE_API_BASE_URL`: base URL dell'API RESTful del backend
- `VITE_APP_NAME`: nome mostrato in UI

## Struttura del progetto

```
src/
  components/   # componenti riutilizzabili (layout, builder, common, templates)
  pages/        # pagine/route dell'app
  context/      # AuthContext (sessione utente) e BuilderContext (editor)
  hooks/        # hook riutilizzabili (useApi, useDebouncedValue)
  services/     # client API e servizi (apiClient, authService, templatesService...)
  utils/        # utility e definizioni condivise (blockTypes)
```

## Note

- L'autenticazione è attualmente simulata (token fittizio salvato in
  `localStorage`), ma con la stessa struttura di una chiamata API reale
  (`src/services/authService.js`): basterà sostituire il mock con la vera
  chiamata `apiClient.post(...)` quando il backend sarà disponibile.
- Le chiamate a `templatesService` e `documentsService` seguono lo stesso
  pattern: un flag `USE_MOCK` isola i dati di esempio dalla vera chiamata
  REST già scritta e pronta all'uso.
- L'header `Authorization: Bearer <token>` viene iniettato automaticamente
  su ogni richiesta da `apiClient.js`; le risposte 401 forzano il logout e
  il redirect al login, le 403 mostrano un toast di errore.
