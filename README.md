# PrintFlow — Frontend

Multi-user SaaS frontend for creating, managing and printing custom layouts
(invoices, reports, resumes) through a visual drag-and-drop editor.
"Production-ready" frontend project: no backend is included, but everything
is already set up to connect to a real RESTful API (JWT authentication,
401/403 error handling, environment variables).

## Stack

- Vite + React (JSX)
- TailwindCSS
- react-router-dom
- @dnd-kit (core, sortable, utilities) for drag-and-drop
- axios (with interceptors for JWT and error handling)
- react-hot-toast, lucide-react

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Environment variables (`.env`):

- `VITE_API_BASE_URL`: base URL of the backend's RESTful API
- `VITE_APP_NAME`: name shown in the UI

## Project structure

```
src/
  components/   # reusable components (layout, builder, common, templates)
  pages/        # app pages/routes
  context/      # AuthContext (user session), BuilderContext (editor) and
                # ContentLibraryContext (reusable resume content)
  hooks/        # reusable hooks (useApi, useDebouncedValue, useElementWidth)
  services/     # API client and services (apiClient, authService, templatesService...)
  utils/        # shared utilities and definitions (blockTypes, layout, cvTemplates)
```

## Notes

- Authentication is currently simulated (a fake token saved in
  `localStorage`), but with the same structure as a real API call
  (`src/services/authService.js`): swap the mock for the real
  `apiClient.post(...)` call once the backend is available.
- Calls in `templatesService` and `documentsService` follow the same
  pattern: a `USE_MOCK` flag isolates the sample data from the real REST
  call, already written and ready to use.
- The `Authorization: Bearer <token>` header is automatically injected on
  every request by `apiClient.js`; 401 responses force logout and redirect
  to login, 403 responses show an error toast.
- The template builder uses a free-form canvas: every top-level block has
  its own `x/y/width/height` and can be dragged and resized on the sheet.
  Text blocks support rich formatting (font, size, color, spacing, lists)
  via the toolbar and the properties panel.
- The Content Library (`/content-library`) holds 9 reusable resume content
  slots (title, profile summary, core competencies, keywords, experience,
  education, skills, quote, contact). Linking a block to a slot (see
  `contentSlot` in PropertiesPanel) lets the same content be tried out
  across different templates without rewriting it.
