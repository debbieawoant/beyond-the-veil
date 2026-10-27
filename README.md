# beyond-the-veil
# Beyond the Veil
### A Cooperative Fantasy Escape-Room Adventure

> *Seven seals have fallen. Four strangers are bound by fate. The way home lies beyond the veil.*

**Beyond the Veil** is a first-person, multiplayer fantasy escape-room game focused on exploration, environmental storytelling, magical puzzles, and cooperative problem-solving. Set in a mysterious world between realities, players must uncover ancient secrets, work together, and discover why they were summoned.

The project is being developed with a focus on immersive 3D environments, meaningful class abilities, accessible browser-based gameplay, and free-to-use development tools.

**Live Prototype:** https://beyond-the-veil.debbieannwoantoine.workers.dev/

**Project Status:** Early prototype — active development

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

**Current multiplayer status:** The project is currently an early browser-based prototype. A complete multiplayer backend, room-code system, synchronized player state, and shared puzzle-state system are planned features and should not be considered implemented until tested successfully.

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
| Supabase Free Plan | Planned multiplayer state, session management, and real-time communication |

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
- Complete puzzle progression and chapter transitions.
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

- [ ] Design the opening chamber's complete puzzle sequence.
- [ ] Implement reusable interaction and puzzle components.
- [ ] Add clue discovery and clue tracking.
- [ ] Implement puzzle validation and progression.
- [ ] Add success, failure, and completion feedback.
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
| `src/ui.js` | Start screen, class selection, party placeholder, journal, hints, and notices |
| `src/style.css` | Existing visual styling and layout |
| `test/prototype.test.js` | Baseline scene, interaction, and control regression tests |

This is a behavior-preserving split of the original prototype, not a new puzzle or multiplayer implementation. There is no backend, Supabase configuration, or required environment variable yet.

### Automated checks

Run these commands from the application folder:

```sh
npm test
npm run build
npm audit
```

Tests use Node's built-in test runner, without an additional test dependency. They check scene structure, independent local state, rune activation counts, orrery rotation, journal updates, movement gating and bounds, mouse-look limits, and targeting/inspection. Some assertions deliberately record incomplete prototype behavior; update them when implementing the corresponding planned feature.

These checks do not replace play-testing: they do not test WebGL rendering, real pointer-lock permission, accessibility, Cloudflare settings, or multiplayer.

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
- Resize the browser and check that the canvas and overlays remain usable.
- Repeat on the uploaded build; record browser, device, steps, expected outcome, and actual outcome for failures.

### Baseline verification and known limitations

On **2026-10-26**, a production build of the original, pre-refactor code matched the public deployment's HTML, JavaScript, and CSS **byte-for-byte**. The corresponding asset filenames were `index-BBLorQlz.js` and `index-ClVH_mX4.css`. Module changes can legitimately produce a different JavaScript filename; that does not update the public deployment automatically.

The baseline work intentionally leaves these existing gameplay issues unchanged:

- The puzzle has no validated sequence, opening exit, or win condition.
- Runes and the star chart are created and registered as interaction targets but never attached to the rendered scene. Fix their visibility and targeting during the puzzle milestone.
- Movement is frame-rate-dependent; collision only clamps the player's position to the room bounds.
- Inspection notices do not pause movement or mouse look; repeated E events and focus changes need better input handling.
- Class abilities, actual party membership, multiplayer, and touch controls are not implemented.

## Contributing and Future Development

- Agree on a plan before implementing gameplay, architecture, or hosting changes.
- Keep changes focused and preserve the existing game direction. Validate behavior before marking a feature implemented.
- Run automated checks and the relevant manual tests before sharing a build.
- Share source through Git and built upload files separately. Do not commit Node installations, `node_modules/`, `dist/`, or local secrets.
- When intentionally changing dependencies or the supported Node/npm versions, update the lockfile and version documentation together and verify a fresh `npm ci` build.
- Multiplayer/backend selection remains a separate decision. Never put server secrets or Supabase service-role keys in browser code; secure shared-state updates must be designed and tested before integration.
