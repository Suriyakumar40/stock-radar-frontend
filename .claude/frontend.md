# Frontend

## Tech Stack

- Angular 20
- Standalone Components
- Bootstrap
- Bootstrap Icons
- Highcharts
- highcharts-angular
- ngx-bootstrap

## Folder Structure

Follow the existing project structure exactly.

src/app/

- core/
    - interceptors/
    - layout/

- features/
    - <feature>/
        - models/
        - services/
        - pages/
        - <feature>.routes.ts

- shared/
    - model/
    - services/
    - helper.ts
    - constants.ts

Do not create a different folder structure.

---

## Features

Each feature belongs under:

features/<feature-name>/

Generate only the required folders.

---

## Components

- Standalone Components
- Reactive Forms
- Strong typing
- Keep components focused on UI

Do not place business logic inside components.

---

## Services

Responsibilities:

- API calls
- Data transformation
- Reuse shared services

Do not duplicate HTTP requests.

---

## Models

Models should match backend API responses.

Do not use any.

Reuse existing shared models whenever possible.

---

## Shared

Before creating new helpers:

Check:

- shared/services
- shared/model
- helper.ts
- constants.ts

Reuse existing code.

---

## Layout

Header

Footer

Sidebar

must remain inside

core/layout/

Do not duplicate layout components.

---

## Routing

Each feature should own its routing file when required.

Register routes in app.routes.ts.

---

## UI

Use:

- Bootstrap
- Bootstrap Icons
- Highcharts

Reuse existing UI components whenever possible.

---

## Code Style

- Strong typing
- No any
- Reusable code
- Clean HTML
- Small components

---

## Before Creating New Files

Search for existing:

- Components
- Models
- Services

Reuse whenever possible.

---

## When I Ask For A Feature

Generate only the required files.

Possible files include:

- Component
- HTML
- SCSS
- Model
- Service
- Route

Do not generate unnecessary boilerplate.

Always follow the existing feature structure.