# Chemistry Study Lab · Units 4 & 5

A responsive, browser-only study companion built from `Honors_Chem_Units_4-5_Study_Guide.docx`.

- **Summary:** all worksheet vocabulary and topics, completed tables, worked naming answers, honors corrections, search, unit filters, topic navigation, review tracking, and a printable guide.
- **Quiz:** multiple-choice concepts and typed names/formulas, topic or unit focus, shuffled 10/20/all sessions, immediate explanations, answer review, and missed-question retries.
- Progress and the current quiz are saved in this browser’s local storage. No account or backend is needed. If storage is unavailable, the app still works for the current session.

## Run

Requires Python 3 to serve locally. Node.js is only needed for the tests.

```sh
npm start
# http://localhost:3000
npm test
```

The complete static app is in `dist/`. Serve that directory with any static host. No build or npm dependencies are required. Fonts load from Google Fonts when available, with local serif/sans-serif fallbacks.

## Content conventions

The attachment is the syllabus, not an answer key. Definitions, solutions, and explanations were developed for the app. The original document is not included in the public repository.

- Fe³⁺ does not specify an isotope; the neutron count and mass number are explicitly unknown.
- The guide’s six fixed-charge metals and its classroom naming conventions are retained. These are course conventions rather than universal claims about every oxidation state.
- Acid names assume aqueous context. Ion columns describe naming bookkeeping, not complete acid dissociation.
- Phosphorous acid is H₃PO₃ and is actually diprotic; its distinction from the worksheet’s formal phosphite pattern is explained.
- Questions include every naming-practice item, all honors corrections, the vocabulary, the ion reference, and key conceptual skills.

## Files

`dist/content.js` contains the study content and question bank. `dist/quiz.js` contains answer normalization, question selection, and scoring. `dist/app.js` renders the interface and manages local progress. The tracked `.openai/hosting.json` identifies the private hosted Site.
