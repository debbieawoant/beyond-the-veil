# beyond-the-veil
# Beyond the Veil
### A Cooperative Fantasy Escape-Room Adventure

> *Seven seals have fallen. Four strangers are bound by fate. The way home lies beyond the veil.*

**Beyond the Veil** is a first-person, multiplayer fantasy escape-room game focused on exploration, environmental storytelling, magical puzzles, and cooperative problem-solving. Set in a mysterious world between realities, players must uncover ancient secrets, work together, and discover why they were summoned.

The project is being developed with a focus on immersive 3D environments, meaningful class abilities, accessible browser-based gameplay, and free-to-use development tools.

**Live Prototype:** https://beyond-the-veil.debbieannwoantoine.workers.dev/

**Project Status:** Early prototype — local first-chamber puzzle and private-test multiplayer rooms, shared puzzle state and contextual pings implemented. Private browser-session tests against hosted Supabase passed; separate-device and public-release acceptance remain outstanding. New installations require the Supabase setup below. The live URL may lag behind local development.

---

## Table of Contents

- [Project Vision](#project-vision)
- [Story and Setting](#story-and-setting)
- [Core Gameplay](#core-gameplay)
- [Character Classes](#character-classes)
- [First Chapter](#first-chapter)
- [Multiplayer Experience](#multiplayer-experience)
- [Visual and Audio Direction](#visual-and-audio-direction)
- [Technology Stack](#technology-stack)
- [Current Implementation](#current-implementation)
- [Development Roadmap](#development-roadmap)
- [Development Principles](#development-principles)
- [Getting Started](#getting-started)
- [Contributing and Future Development](#contributing-and-future-development)

---

## Project Vision

Beyond the Veil aims to combine the intricate environmental puzzles of games like *The Room* with the communication and cooperative problem-solving of games like *We Were Here*.

The goal is to create a memorable fantasy adventure in which players cannot simply rush through a room. They must observe their surroundings, investigate mysterious mechanisms, share discoveries, and use their characters' unique abilities to overcome obstacles.

### Core pillars

- **Cooperation over combat:** Progress depends primarily on observation, puzzle-solving, and teamwork.
- **Meaningful character abilities:** Each class contributes a distinct way to interact with the environment.
- **Immersive exploration:** Rooms should feel like believable, ancient places filled with history and secrets.
- **Environmental storytelling:** Architecture, artifacts, inscriptions, and puzzle discoveries reveal the world's history.
- **Accessible multiplayer:** Players should be able to join a shared adventure through a browser without expensive hardware or paid game clients.
- **Mystery and discovery:** Every solved puzzle should reveal another piece of the larger story.

## Story and Setting

### The World of Elarion

Elarion is a magical world existing between realities — a place where forgotten kingdoms, ancient magic, and broken dimensions intersect.

The characters begin in ordinary lives, unaware of the forces moving beyond their own reality. Without warning, they are pulled into Elarion and awakened inside an unfamiliar chamber.

Seven ancient seals have been broken.

Something has disturbed the balance between worlds, and the boundaries separating realities are beginning to fail. The players must uncover the truth behind the broken seals, discover who summoned them, and find a way back home.

But returning may not be as simple as escaping the chamber.

### Narrative themes

- Fate versus free will
- Trust between strangers
- Forgotten histories and lost civilizations
- The consequences of forbidden magic
- The meaning of home and belonging
- The mystery of the seven broken seals

Storytelling will primarily occur through the environment, puzzle discoveries, artifacts, magical visions, and chapter progression.

## Core Gameplay

The intended gameplay loop is:

1. **Explore** — Search each chamber for clues, mechanisms, hidden symbols, and unusual objects.
2. **Investigate** — Inspect artifacts and identify relationships between environmental details.
3. **Communicate** — Share discoveries, ask teammates for assistance, and coordinate actions.
4. **Use abilities** — Apply character-specific skills to reveal clues or manipulate mechanisms.
5. **Solve puzzles** — Combine observations and abilities to unlock new areas.
6. **Uncover the story** — Discover what happened in Elarion and why the players were summoned.
7. **Progress** — Advance through increasingly complex chambers and chapters.

Puzzles should reward careful observation and logical deduction rather than random trial and error.

## Character Classes

The game is designed around four distinct classes. Each class provides a unique interaction with the environment.

### 1. Mage — Aether Lens

**Specialty:** Magical perception and hidden knowledge.

The Mage can perceive details invisible to other characters.

Planned abilities:
- Reveal concealed runes and magical inscriptions.
- Detect magical traces left by previous occupants.
- Identify hidden patterns in celestial or arcane mechanisms.
- Discover clues that help the party interpret otherwise mysterious symbols.

### 2. Paladin — Oathbound Shield

**Specialty:** Stabilization and protection.

The Paladin can interact with unstable magical structures and mechanisms.

Planned abilities:
- Stabilize magical devices long enough for teammates to use them.
- Hold mechanisms in position while other players complete an interaction.
- Reveal or activate mechanisms connected to ancient oaths and protective magic.
- Help the group navigate environmental hazards.

### 3. Warrior — Runebreaker Gauntlet

**Specialty:** Strength and heavy mechanisms.

The Warrior can manipulate objects that require physical force.

Planned abilities:
- Operate heavy levers and ancient stone mechanisms.
- Move or reposition substantial objects.
- Break through designated weakened barriers.
- Activate mechanisms that require sustained physical pressure.

### 4. Rogue — Whisperpick

**Specialty:** Precision, locks, and concealed passages.

The Rogue specializes in uncovering details and accessing restricted mechanisms.

Planned abilities:
- Pick intricate locks.
- Discover concealed catches and hidden compartments.
- Access alternate routes through certain mechanisms.
- Investigate delicate devices that require precise manipulation.

### Class design principles

- Every class should have opportunities to contribute.
- Class abilities should create meaningful differences in what players can perceive or do.
- No class should become permanently useless because a player is absent.
- Smaller parties should have alternate solutions, ability combinations, or environmental workarounds.
- Solo or reduced-party accessibility may be explored without eliminating the advantages of cooperation.

## First Chapter

### The Chamber of the Thirteenth Bell

The opening chapter introduces players to Elarion through a mysterious stone chamber filled with ancient architecture, celestial symbolism, and magical mechanisms.

The chamber serves as the first environment in which players learn to explore, inspect objects, discover hidden clues, and understand how class abilities will work.

### Planned environmental features

- Weathered stone walls and tiled floors
- Carved architectural details and ancient reliefs
- Brass mechanisms and ornate metal fittings
- Wall sconces and atmospheric lighting
- Magical runes and concealed inscriptions
- A central pedestal containing a mysterious celestial artifact
- An intricate orrery or star-chart mechanism
- A sealed exit that opens after the chamber's puzzle is solved

### Puzzle direction

The opening puzzle will combine environmental clues with celestial and magical mechanisms. Players will need to observe patterns, interpret symbols, and coordinate their abilities to progress.

The central artifact and its surrounding mechanisms will become important elements of the chamber's mystery.

The chapter should establish the tone of the game: quiet tension, discovery, ancient magic, and the feeling that the chamber was built for a purpose the players do not yet understand.

### Current local playtest rules

1. Inspect the glowing brass **Star Chart** on the west (left-hand) wall. Its clue is added to the journal.
2. Activate the east-wall symbols in the order **Crown → River → Gate**. The Crown has three points, the River has two waves, and the Gate is an arch. Their physical arrangement is not the solution order.
3. A wrong rune resets all rune progress, but keeps the journal clue. Repeating an already-active rune is safe. Activated runes glow gold instead of blue.
4. With all three runes active, inspect the central **Celestial Orrery** to align its rings and open the northern exit. Early orrery use does not erase progress.
5. **Walk through the glowing open doorway** to complete the chamber automatically when you cross its threshold. E only inspects the doorway; it no longer completes the chamber from a distance.
6. Choose **Play again** to reset the puzzle, journal, door, and player view. Progress is local and is not saved across reloads.

Use WASD to move, the mouse to look, and E to interact or dismiss an inspection. A crosshair and separate targeting prompt identify what E will affect; inspection notices pause movement and mouse look. Escape releases the mouse; after closing a notice, click the scene to capture it again. Every class can complete this local puzzle because class abilities are not active yet.

## Multiplayer Experience

The long-term goal is to support cooperative sessions of up to four players.

### Planned multiplayer features

- Create or join a session using a room code.
- Assign or select a character class.
- Synchronize player positions and movement.
- Display party members and their connection status.
- Synchronize puzzle progress and important interactions.
- Share discoveries and coordinate actions.
- Support quick communication callouts and contextual pings.
- Maintain a shared clue journal.
- Handle player disconnections and rejoining.
- Ensure puzzle state remains consistent for all connected players.

### Party interface

The planned party panel will display each player's class, connection status, and relevant ability information.

It should remain compact and unobtrusive so players can focus on the environment rather than managing menus.

### Communication tools

Communication is central to the experience, particularly when one player sees information another cannot.

Planned tools include:
- Quick callouts for common observations and requests.
- Contextual pings to point out objects or locations.
- A shared journal for discovered clues.
- Optional text communication for coordinating puzzle solutions.

**Current multiplayer status:** The private-test implementation supports anonymous guests, eight-character room codes (up to four members), a real roster, shared journal/runes/door state, individual exit completion, reconnect snapshots, host-only restart and contextual Q/middle-mouse pings. Database rules and two independent clients are tested locally. User-reported browser-session checks against hosted Supabase confirmed membership, shared journal/door updates, individual completion, restart, pings, reconnect and late joining. Separate-device acceptance remains outstanding. Avatars, class abilities, touch controls and a ping wheel remain planned. See [Supabase setup and testing](supabase/README.md).

## Visual and Audio Direction

Beyond the Veil is intended to have a grounded, atmospheric fantasy aesthetic rather than an anime or webtoon-inspired appearance.

### Visual style

- Ancient, believable dungeon architecture
- Weathered stone, carved masonry, and worn surfaces
- Brass, iron, and aged metal mechanisms
- Intricate celestial instruments and magical artifacts
- Subtle magical illumination
- Deep shadows and controlled atmospheric fog
- Detailed focal objects that reward close inspection
- A restrained color palette emphasizing stone, bronze, dark blue, and magical light

The environment should feel like a physical place rather than a collection of unrelated geometric shapes.

### Environmental storytelling

Objects should communicate history and purpose through their construction, placement, condition, and interaction.

Examples include worn inscriptions around frequently used mechanisms, damaged carvings that suggest past events, and celestial instruments that reveal the chamber's original function.

### Audio direction

Planned audio elements include:
- Ambient dungeon soundscapes
- Distant bells and low atmospheric drones
- Stone mechanisms grinding into motion
- Metal clicks and mechanical locking sounds
- Magical activation effects
- Distinct audio feedback when puzzles change state

Audio should reinforce discovery and tension without overwhelming communication between players.

## Technology Stack

The project prioritizes browser-based development, low operating costs, and tools that can be used without expensive subscriptions.

| Technology | Intended purpose |
|---|---|
| JavaScript | Game logic and interactions |
| Three.js | Real-time 3D rendering |
| HTML | Game page and interface structure |
| CSS | Styling, HUD, menus, and interface layout |
| Git and GitHub | Version control and source management |
| VS Code for the Web (`vscode.dev`) | Browser-based code editing |
| Cloudflare | Hosting and deployment of the browser prototype |
| Supabase Free Plan | Private-test guest identities, room/puzzle RPCs, and private Realtime notifications/pings; hosted setup required |

The precise multiplayer architecture may evolve as development progresses. Any backend or service integration must be verified against its current capabilities, free-tier limits, and security requirements.

### Cost philosophy

Development should remain as close to **$0 upfront cost** as possible.

The project should prioritize:
- Free development tools
- Free hosting tiers where suitable
- Open-source libraries
- Browser-accessible workflows
- No paid game engine requirement
- No mandatory paid subscription for contributors to edit the code

Third-party free tiers may have usage limits and can change. Production costs should be reassessed if the game's audience grows.

## Current Implementation

### Implemented in the prototype

- A browser-accessible game build.
- A Three.js-based 3D environment.
- First-person camera and movement.
- Basic environmental geometry and interactive objects.
- Keyboard-based movement and object inspection.
- An initial HUD and fantasy-themed interface.
- A live Cloudflare-hosted prototype.
- A complete **local** first-chamber puzzle with visible, distinct rune glyphs, a readable chart, enforced activation order, retry feedback, an opening exit, completion, and replay.
- Frame-rate-independent movement, inspection input guards, and scenery-aware targeting.

The local additions above have not been deployed automatically. Multiplayer is still not implemented.

### In active development

- Improving the chamber's architectural detail.
- Adding procedural stone textures and surface variation.
- Refining floor tiles, wall trim, sconces, and lighting.
- Making important objects more detailed and visually distinctive.
- Developing the celestial artifact into a compelling puzzle centerpiece.

### Planned, not yet confirmed as implemented

- Fully functional multiplayer sessions.
- Room creation and room codes.
- Persistent or synchronized player classes.
- Functional class-specific abilities.
- Shared puzzle state and clue journal.
- Contextual pings and cooperative communication.
- Additional puzzle sequences and chapter transitions.
- Full audio design and additional chambers.

The interface or visual presence of a feature does not mean its underlying functionality is complete. Features should be marked implemented only after they have been tested.

## Development Roadmap

### Phase 1 — Foundation and Environment

- [x] Establish a browser-based Three.js prototype.
- [x] Deploy the prototype to Cloudflare.
- [x] Implement basic first-person movement.
- [x] Add an initial chamber and interactive objects.
- [ ] Improve architectural detail and material quality.
- [ ] Refine lighting, shadows, and atmosphere.
- [ ] Create a detailed celestial mechanism.
- [ ] Improve object inspection and interaction feedback.

### Phase 2 — Puzzle System

- [x] Design the opening chamber's complete puzzle sequence.
- [x] Implement modular interaction and puzzle components.
- [x] Add local clue discovery and clue tracking.
- [x] Implement local puzzle validation and progression.
- [x] Add success, failure, completion, and replay feedback.
- [ ] Test puzzle logic with different party sizes.

### Phase 3 — Character Abilities

- [ ] Implement Mage magical perception.
- [ ] Implement Paladin mechanism stabilization.
- [ ] Implement Warrior heavy interactions.
- [ ] Implement Rogue precision interactions.
- [ ] Add clear visual and audio ability feedback.
- [ ] Design alternate puzzle routes for smaller parties.

### Phase 4 — Multiplayer

- [ ] Establish a Supabase project using the free tier, if suitable.
- [ ] Design secure session and room-code management.
- [ ] Implement player joining and session synchronization.
- [ ] Synchronize player positions and class selections.
- [ ] Synchronize puzzle interactions and progression.
- [ ] Add connection status and reconnection handling.
- [ ] Implement shared clues and communication tools.
- [ ] Test multiplayer with multiple independent browser sessions.

### Phase 5 — Polish and Expansion

- [ ] Add environmental audio and interaction sounds.
- [ ] Improve menus, onboarding, and accessibility.
- [ ] Complete and test the first chapter.
- [ ] Add additional chambers and narrative discoveries.
- [ ] Optimize performance across supported browsers.
- [x] Document development setup, manual deployment, and baseline testing.

## Getting Started

### Development requirements

- **Node.js 24 LTS** and **npm 11** for installing dependencies, running tests, and building the site. The tested versions are Node **24.22.1** and npm **11.19.1**; the app's `.nvmrc` records the Node version.
- A desktop browser with WebGL 2 support, a keyboard, and a mouse to play the current prototype.

Node is **development tooling, not a game server**. The built game runs in the browser. Players and contributors who only upload an already-built site do not need Node.

Use a Node version manager if you already have one, or install the appropriate version from [nodejs.org](https://nodejs.org/en/download). Keep the Node runtime and its bundled npm outside the repository, and do not use `sudo npm install`. Vite is installed locally in the ignored `node_modules/` folder by `npm ci`; no global Vite installation is needed.

### Run locally

On Linux/macOS, the executable launcher can start a playtest from the repository root:

```sh
./playtest.sh
```

It uses Node/npm on your PATH, or the temporary portable Node installation if available in this workspace. It installs locked dependencies if Vite is missing, then starts a localhost-only development server. It does not download Node or change system settings. Extra Vite arguments can be passed through, for example `./playtest.sh --port 5174`. If Node is missing or incompatible, use the manual setup below.

For double-click launching on this KDE workstation, use **`Play Beyond the Veil.desktop`** in the repository root, rather than the `.sh` file. If KDE asks, approve launching/executing it. It opens Konsole, starts the server, and opens the browser automatically; Konsole stays open to show any errors. Stop the server with Ctrl+C. This shortcut records this workstation's absolute project path and requires Konsole; update its `Exec` entry if the project moves. No desktop settings or application registrations are changed.

From the repository root (the folder containing this README), enter the **nested application folder**:

```sh
cd beyond-the-veil
```

If using `nvm`, select the recorded version first:

```sh
nvm install
nvm use
```

Then install the locked dependencies and start the development server:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. Stop the server with Ctrl+C. Do not open the source `index.html` directly: its JavaScript imports and CSS need Vite's development server or a production build.

`package-lock.json` is tracked so collaborators get the same dependency versions. Use `npm ci` for normal setup; use `npm install` only when intentionally updating dependencies, and review the resulting lockfile changes. Development dependencies must be included because Vite is the build tool.

For the tested npm version, `package.json` also approves only the reviewed `esbuild@0.28.2` installation script, which prepares and validates Vite's platform-specific build binary. Review new install scripts and update that pinned approval deliberately when upgrading dependencies; do not blanket-approve all scripts.

### Code organization

All paths below are relative to the application folder:

| File | Responsibility |
|---|---|
| `src/main.js` | Camera, renderer, animation loop, resizing, and module wiring |
| `src/scene.js` | Chamber geometry, lighting, materials, and inspectable objects |
| `src/controls.js` | Keyboard input, mouse look, movement, and targeting |
| `src/interactions.js` | Local prototype interaction state and inspection effects |
| `src/puzzle.js` | Pure local puzzle rules, stable rune identifiers, and resettable state |
| `src/ui.js` | Lobby, class selection, connected-party roster, journal, hints, and notices |
| `src/multiplayer.js` | Guest/session handling, room RPCs, private subscriptions, reconnect snapshots and heartbeat |
| `src/pings.js` | Validated, expiring world-anchored ping labels and off-screen indicators |
| `src/style.css` | Existing visual styling and layout |
| `test/prototype.test.js` | Scene, interaction, control, and raycast-driven chamber tests |
| `test/puzzle.test.js` | Puzzle sequence, validation, idempotency, completion, and reset tests |
| `test/multiplayer.test.js` | Transport, reconnect, revision, ping and async-interaction tests |
| `test/database.test.js` | Actual SQL migration, permissions, puzzle/room rules and two-client integration in embedded PostgreSQL |
| `scripts/browser-check.mjs` | Optional headless Firefox check using the real UI/SQL and a local test transport |

The original prototype was first split into modules without changing behavior. The local puzzle remains available without a backend. Multiplayer uses Supabase and requires the settings and migration below. PGlite is a development-only database test dependency; it is not a game server and is never included in the deployed site.

### Supabase connection settings

Vite is the existing development/build tool, not a separate online service. Its local settings go in a plain-text file named `.env.local` in the **nested application folder**, beside `package.json`. There is no need to install another tool or configure Cloudflare to prepare this file.

1. Open the Supabase project and click **Connect** at the top. In the app/framework connection section, copy the **Project URL** and **Publishable key**. The Project URL looks like `https://YOUR_PROJECT_REF.supabase.co`; it is not the dashboard address or a `postgresql://` database connection string.
2. Copy `beyond-the-veil/.env.example` to `beyond-the-veil/.env.local` (both paths relative to this README). On this workstation the full settings path is `/home/arthura/AI/projects/beyond-the-veil/beyond-the-veil/.env.local`.
3. Open `.env.local` in a text editor and replace the two Supabase placeholders with the project's values:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   VITE_TURNSTILE_SITE_KEY=
   ```

4. Leave the Turnstile site key empty for private testing. Follow [the owner setup checklist](supabase/README.md) to run the one-time SQL migration and configure private Realtime. Restart the local development server after changing this file. Production uploads need a new build to include updated settings.

The URL and publishable key are public browser configuration. Never put a database password, Supabase secret/service-role key, or Turnstile secret in a `VITE_` setting; Vite exposes these settings to browser code. `.env.local` is ignored by Git; `.env.example` contains placeholders only. With valid settings, use **Create room / Join room**, then **Enter room**. Without settings, **Play solo** still works. Room creation reports missing database setup instead of silently falling back to unsynchronized play.

**Deferred public-multiplayer prerequisite — Turnstile:** anonymous sign-ins have been enabled in Supabase, but the person doing setup does not have access to the Cloudflare account. Private testing can proceed without Turnstile. Before public testing/release, revisit this with the Cloudflare owner. **CAPTCHA token collection/submission is not implemented yet**; supplying a site key alone is insufficient. Add that frontend flow before enabling Supabase CAPTCHA enforcement. See the [release reminder](supabase/README.md#deferred-release-prerequisite-turnstile). Never put its secret in browser settings.

### Automated checks

Run these commands from the application folder:

```sh
npm test
npm run build
npm audit
```

Tests use Node's built-in test runner and the development-only PGlite dependency for actual PostgreSQL migration checks. Coverage includes local puzzle/doorway/input regressions, private room permissions and capacity, simultaneous/stale actions, individual completion, host reset, reconnect/poll recovery, safe ping payloads/cooldowns and two independent clients cooperating through SQL RPCs.

For an optional WebGL/UI acceptance check with Firefox installed, run `npm run test:browser`. It creates an isolated temporary Firefox profile and loopback test server, substitutes a local transport for Supabase, and runs the actual SQL migration in PGlite. It never contacts or changes the hosted Supabase project. Set `FIREFOX_BIN` if Firefox is not on PATH and `BTV_TEST_TMP` to choose a temporary directory. Snap-confined Firefox may need a profile directory it can access or a non-confined executable. The check simulates pointer capture/frame timing; real permissions and human usability still need manual testing.

These checks do not replace real separate-device play, hosted Supabase gateway/WebSocket authorization, accessibility checks or Cloudflare deployment checks. Follow the [multiplayer acceptance checklist](supabase/README.md#acceptance-checklist) after configuring the project.

### Production build and preview

```sh
npm run build
npm run preview
```

Open the URL printed by Vite, normally `http://localhost:4173`. `preview` is for local verification, not a production hosting server. Each build creates the deployable site in `beyond-the-veil/dist/`, relative to the repository root:

```text
dist/
  index.html
  assets/
    index-<hash>.js
    index-<hash>.css
```

`node_modules/` and `dist/` are ignored by Git. Installed dependencies are only needed on a build machine; **only the contents of `dist/` are uploaded to the static host**. The site currently loads optional Google Fonts externally, with local fallback fonts defined in CSS.

### Manual upload to Cloudflare

The current prototype URL is <https://beyond-the-veil.debbieannwoantoine.workers.dev/>. Keep the existing Cloudflare host for now; choosing Supabase for multiplayer would not by itself require moving the frontend.

1. On a build machine, run `npm ci`, `npm test`, and `npm run build` from the application folder.
2. Check the production build with `npm run preview` and the manual checklist below.
3. Give the contributor the **complete contents of `dist/`**, either as a folder or a ZIP whose top level contains `index.html` and `assets/`. They can upload those built files without installing Node.
4. The Cloudflare account owner should publish these files through the existing Worker's static-asset deployment workflow. Upload HTML, JS, and CSS together so their hashed filenames match. Do not upload `src/`, the source `index.html`, `node_modules/`, credentials, or the repository ZIP as the website.
5. Open the public HTTPS URL in a fresh browser session and repeat the checklist. Confirm that requests for `/assets/…` return actual JS/CSS, not an HTML fallback or a 404.

The account's existing upload mechanism, dashboard controls, and build integration have **not** been confirmed. No account settings were changed and no deployment was performed as part of the baseline work. If the existing workflow does not accept an asset folder/ZIP, confirm the owner's deployment method rather than replacing the Worker or creating another site. Cloudflare's [static assets guide](https://developers.cloudflare.com/workers/static-assets/get-started/) documents CLI deployment as an alternative; Wrangler is not a dependency of this app.

For a future Git-connected build, the application/root directory is `beyond-the-veil`, dependency installation is `npm ci`, and the build command is `npm run build`. The static asset directory is `dist` relative to that application directory. These are build inputs, not a claim that Git integration is currently configured.

### Manual test checklist

- Start screen, class dropdown, and HUD load without JavaScript errors or missing assets.
- Choose a class and enter; the entry hint names the selected class.
- Confirm the chamber and celestial mechanism render.
- Move with WASD and look with the mouse after allowing pointer lock.
- Press Escape to release the pointer; click the canvas to capture it again.
- Approach the orrery, aim at it, press E to inspect, and press E again to dismiss.
- Before reading the chart, confirm that the runes/orrery ask you to find it and cannot unlock the exit.
- Inspect the chart on the west wall; confirm that its inscription appears in the journal.
- On the east wall, try Gate first: confirm the wrong-order notice and zero rune progress. The journal should remain intact.
- Activate Crown, River, then Gate; check their distinct shapes, gold activation feedback, and the progress display. Repeating an active rune should not advance or reset the sequence.
- Before unlocking, try walking through the sealed northern doorway; confirm that it blocks passage and does not complete the chamber.
- Use the orrery to open the north-wall exit. Inspecting the open doorway with E should only explain how to leave. Dismiss the notice and walk through the opening; verify automatic completion past the threshold and released mouse capture. Walls beside the doorway and the passage sides should still block movement.
- Click Play again; confirm a fresh camera position, empty journal, blue runes, sealed exit, and a working second attempt. The doorway must block walking again until unlocked.
- While inspecting, confirm that movement/look are paused and holding E does not immediately dismiss the notice. Escape/focus changes should not leave movement keys stuck.
- Resize the browser and check that the canvas and overlays remain usable.
- Repeat on the uploaded build; record browser, device, steps, expected outcome, and actual outcome for failures.

### Verification history and remaining limitations

On **2026-10-26**, a production build of the original, pre-refactor code matched the public deployment's HTML, JavaScript, and CSS **byte-for-byte**. The corresponding asset filenames were `index-BBLorQlz.js` and `index-ClVH_mX4.css`. Module changes can legitimately produce a different JavaScript filename; that does not update the public deployment automatically.

The earlier local puzzle passed 35 Node tests and a headless Firefox solve/retry/replay check. The private multiplayer milestone now passes **73 tests**, a production build and dependency audit, plus a two-player headless Firefox check of shared journal/runes, contextual expiring pings, individual completion, reload/rejoin, host reset and leave. The browser check uses real WebGL and the actual SQL migration with a local test transport, deterministic frame timing and simulated pointer capture. These automated checks do not alter the hosted project.

On **2026-10-27**, the user applied the Supabase migration and tested independent browser sessions against hosted Supabase. They confirmed both players in the party list, host actions updating the joiner's journal/door, individual walk-through completion, host restart, contextual pings, refresh/reconnect and late joining with current progress. An initial Realtime join failure recovered on reload; its original cause was not established. Closing a tab retained its reserved membership as designed; a fresh private session joined as a new identity. Separate-device testing, broader usability and public-release security acceptance remain outstanding; no Cloudflare deployment was performed.

Remaining limitations:

- Movement is bounded by the room and the narrow exit passage, which opens only after unlocking. Pillars and the pedestal do not yet block movement.
- Private multiplayer passed user-reported browser-session checks against hosted Supabase; separate-device acceptance remains outstanding. Class abilities, avatars, a ping wheel and touch controls are not implemented. Disconnected seats remain reserved; a host remove-away-player control is not implemented.
- Solo progress is in memory only. Configured multiplayer rooms persist for 24 hours and reconnect depends on retained browser identity. Additional chapters, audio, and broader accessibility/performance work remain planned.
- The existing public deployment is not automatically updated by local edits or builds.

## Contributing and Future Development

- Agree on a plan before implementing gameplay, architecture, or hosting changes.
- Keep changes focused and preserve the existing game direction. Validate behavior before marking a feature implemented.
- Run automated checks and the relevant manual tests before sharing a build.
- Share source through Git and built upload files separately. Do not commit Node installations, `node_modules/`, `dist/`, or local secrets.
- When intentionally changing dependencies or the supported Node/npm versions, update the lockfile and version documentation together and verify a fresh `npm ci` build.
- Supabase multiplayer changes require versioned migrations and permission/action tests. Never put server secrets or Supabase service-role keys in browser code. Keep public access deferred until the abuse-protection and hosted acceptance checklist is complete.
