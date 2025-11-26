# RecipeBank – Global Recipe Library with AI Assistant

RecipeBank is a free, static, global recipe platform.  
The project has two main parts:

1. A **country-based recipe browser** where users can explore dishes from many countries.
2. An **AI-inspired Chef Assistant** that helps users find recipes based on ingredients, country, and difficulty (local logic first, later can be upgraded to real AI API).

The main goal is to keep the project:
- **Free to host** (GitHub Pages).
- **Simple to run** (pure HTML, CSS, JavaScript).
- **Data-driven** (recipes stored in JSON, no hard-coded duplicates).

---

## 1. Core Concept

RecipeBank is a “global recipe bank”:

- Each **country** has a small hub page that lists its recipes.
- Each **recipe** has:
  - English and local name
  - Country
  - Short story / description
  - Ingredients with precise quantities
  - Ordered steps
  - Cooking time
  - Difficulty level
  - Tags (e.g. vegan, spicy, gluten-free, dessert, quick)
  - Optional nutrition information

The website is designed as a **static SPA-like experience** using only the browser and JSON data. No backend or database server is required.

---

## 2. MVP Scope

The first iteration (MVP) should include:

- A **Home page** that shows:
  - A grid of countries (e.g. Italy, India, Japan, Mexico, Turkey, Morocco, France, Thailand, Lebanon, Syria…)
  - Basic intro about the project.

- A **Country page** for each country (e.g. `/countries/italy.html`) that:
  - Loads recipes for that country from `recipes.json`.
  - Shows them as cards with image, short description, tags, and time.
  - Links each card to a recipe detail page.

- A **Recipe detail page** for each recipe (e.g. `/recipes/margherita-pizza.html`) that:
  - Renders the full recipe from `recipes.json`.
  - Shows ingredients list, steps, time, difficulty, country, and tags.
  - Uses a “cooking mode” layout that is easy to read on mobile while cooking.

- An **AI Assistant page** (e.g. `/assistant.html`) that:
  - Does NOT call any external AI API in the MVP.
  - Uses local logic to search and rank recipes from `recipes.json`.
  - Lets the user type:
    - available ingredients (comma separated)
    - optional country filter
    - optional difficulty filter
  - Suggests recipes that best match the query.
  - Feels like a simple chat or Q&A interface (input + results), but everything is computed in the browser.

---

## 3. Technology & Hosting

- No backend, **no database**, no frameworks required.
- Fully static site:
  - **HTML5**
  - **CSS3**
  - **Vanilla JavaScript**
- Hosted via **GitHub Pages** from this repository.
- All dynamic behavior relies on JSON and client-side JS.

This keeps the project:
- Free to run
- Easy to maintain
- Easy for contributors to understand

---

## 4. Repository Structure (Target)

A suggested structure (can be adjusted as we refine):

```text
/
├─ public/
│  ├─ index.html              # Home page (country overview)
│  ├─ countries/
│  │  ├─ italy.html
│  │  ├─ india.html
│  │  ├─ japan.html
│  │  └─ ... (more countries)
│  ├─ recipes/
│  │  ├─ margherita-pizza.html
│  │  ├─ ramen.html
│  │  └─ ... (recipe detail templates wired to JSON)
│  ├─ assistant.html          # AI-inspired chef assistant (local logic)
│  └─ assets/
│     ├─ css/
│     │  ├─ main.css
│     │  └─ layout.css (optional)
│     ├─ js/
│     │  ├─ main.js          # shared logic (navigation, helpers)
│     │  ├─ countries.js     # loading and rendering country recipe lists
│     │  ├─ recipe-detail.js # rendering single recipe from JSON
│     │  ├─ assistant.js     # local search/“AI” logic on top of recipes.json
│     │  └─ ui-helpers.js    # small UI helpers if needed
│     └─ img/
│        └─ ... recipe and country images
│
├─ src/
│  ├─ data-model.js           # optional: helpers for working with recipe data
│  ├─ build-scripts/          # optional future CLI / generator scripts
│  └─ ...
│
├─ data/
│  └─ recipes.json            # main recipe database for MVP
│
├─ PROGRESS.md                # high-level progress log for each iteration
└─ README.md                  # this file

