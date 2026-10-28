# Private multiplayer setup

The frontend stays on Cloudflare. Supabase supplies guest identities, rooms,
authoritative puzzle rules, and private Realtime notifications/pings. No server
password or service-role key is needed by the game.

## Owner checklist

1. Open the intended Supabase project. Under Authentication, enable **Anonymous
   Sign-Ins** (already done for the current setup).
2. Open **SQL Editor → New query**. Copy the entire contents of
   [`migrations/202610270001_rooms.sql`](migrations/202610270001_rooms.sql), paste,
   and click **Run**. This is a **one-time migration**, not a query to rerun on
   every launch. It creates only the game's `btv_private` schema, `btv_` public
   functions, and one `btv_receive` Realtime policy. It does not replace existing
   schemas/publications/policies or delete any existing application data. If it
   fails, stop and share the error text, not credentials. The transaction rolls
   back the migration on failure.
3. In **Realtime → Settings**, disable **Allow public access** and save. This
   game subscribes only to private channels. No tables need adding to a
   Postgres Changes publication: notifications originate in the database via
   `realtime.send()` instead.
4. Check that there are **no other permissive Realtime policies** granting every
   authenticated user access to every topic or allowing arbitrary client
   broadcasts. Policies combine with OR. If this project serves other apps,
   review their topic-specific policies instead of deleting them blindly.
5. Keep the **Data API** enabled with `public` exposed (the usual default). Do
   **not** expose `btv_private`. Authenticated guests can call the `btv_` RPCs;
   they cannot write game tables directly. Do not add public read/write policies
   to make errors disappear.
6. Click **Connect** at the top of the project to find its **Project URL** and
   **Publishable key**. Put these in `beyond-the-veil/.env.local`, beside the
   app's `package.json`:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
   VITE_TURNSTILE_SITE_KEY=
   ```

7. Restart the local launcher. Enter a display name and class, click **Create
   room**, then **Enter room**. On a second device or in a separate browser
   profile/private window, enter the code with **Join room → Enter room**.
   Two ordinary tabs in one browser profile share a Supabase identity and
   **are not two distinct players**. Stay at four players or fewer per room.

If the Realtime dashboard labels have changed, use its settings search or share
a redacted screenshot rather than changing unrelated database settings.

### If a room code appears but connection fails

A room code means guest sign-in and the room-creation RPC succeeded. It does
not prove the private WebSocket channel joined. Do **not** rerun the initial
migration, enable public channels, or loosen policies as a workaround.

Refresh the local game and read the full `Realtime connection failed (STATUS)`
message. The client preserves the SDK's server reason (including a nested
cause), redacts credentials and retains the saved room for reconnect. A timeout
and an explicit policy/authentication rejection need different fixes. Share
only that error text or a redacted screenshot; do not share browser storage,
WebSocket URLs, JWTs or session tokens. Check Supabase's Realtime logs if no
server reason is available. A successful snapshot heartbeat alone does not
prove the WebSocket is connected.

### Testing from two devices without publishing

The normal launcher listens only on this computer. To opt into trusted local
network access, run `./playtest.sh --host 0.0.0.0` from the repository root and
open the computer's LAN address and printed port on the other device. Use a
trusted network, allow the port through the firewall only if needed, and stop
the server after testing. Do not port-forward Vite to the internet. Keyboard,
mouse, WebGL 2 and pointer capture are still required; mobile touch play is not
implemented. A second browser profile on this computer is the simplest first
test. Never run the development server with untrusted secrets in Vite settings.

## Acceptance checklist

- Host creates a room; second player joins by code. Both rosters show both names
  and the same code. Names are rendered as text, not HTML.
- A player cannot inspect a chart/rune/orrery from across the room or through a
  wall. E still opens a notice and pauses that player's exploration.
- One player reads the chart; both journals gain the clue. The other player
  activates Crown, then players alternate River and Gate. Both see gold runes.
- Wrong order resets both players' runes without clearing either journal.
  Repeated activation is safe. Early alignment cannot unlock the door.
- Try near-simultaneous actions. If a revision is stale, that action must not
  execute silently: the player gets an up-to-date view and a retry hint.
- Aim and press **Q / middle mouse** to ping an object or surface. The other
  player sees the sender's name/color, a contextual label, and an off-screen
  arrow if looking away. A newer ping replaces that sender's marker. Markers
  expire after five seconds, with a one-second cooldown.
- Either player aligns the orrery. The door opens for both. Each must walk
  through the threshold to finish; one player's completion does not finish or
  freeze the other's game. The backend validates the unlocked prerequisite;
  camera movement/line of sight are client-side, not anti-cheat guarantees.
- Reload with the same browser storage: the room, journal, runes, door and that
  player's completion return. Enter room requires a fresh click for mouse
  capture. Clearing browser data loses the guest identity and its reserved seat.
- Disconnect/reconnect: shared actions pause when Realtime is disconnected;
  after reconnect, the game fetches a fresh snapshot before enabling them.
  An ambiguous failed action is not automatically resubmitted. Polling every
  15 seconds also repairs missed notifications and updates roster timestamps.
- Only the host sees **Restart shared puzzle** (release mouse with Escape to
  click the HUD). Confirm the prompt. Everyone returns to the starting position,
  with a sealed exit, empty journal, no pings and cleared completion. Nonhosts'
  completion screen waits for the host.
- **Leave room** removes membership, stops the subscription and returns to the
  solo/lobby screen. If the host explicitly leaves, the first remaining player
  becomes host. Disconnecting alone reserves the seat/host role for reconnect.
- A fifth identity cannot join a full room. Another room cannot read this room's
  state or receive its messages. A malformed/nonexistent code gives a useful
  error, not an empty or broken chamber.
- Build and upload only `dist/` contents for hosted testing. Vite embeds public
  configuration at build time. Do not upload `.env.local`, source, dependencies,
  database SQL, or secrets as site assets.

## Limits and operational notes

- Rooms expire **24 hours after creation**, including reserved disconnected
  seats. An empty room closes immediately after the last explicit leave.
- A guest may belong to at most three unexpired rooms. Creating rooms has a
  ten-second cooldown; code guesses have a one-second cooldown, including failed
  guesses. These modest limits are for private testing, not complete abuse
  prevention. Eight-character room codes act as invitations: share privately.
- Rosters derive identity/name/class from database membership. A heartbeat less
  than 45 seconds old means connected; this is an approximate presence signal,
  not a guarantee the browser still has a socket open. The game sends no avatar
  position stream and has no avatars, chat, class abilities or ping wheel yet.
- Realtime authorization is cached on an established connection until rejoin or
  JWT refresh. The normal client unsubscribes on leave; membership checks prevent
  new subscriptions/RPCs after leave. Immediate eviction of a hostile already-
  subscribed client is **not** implemented. Do not use rooms to share sensitive
  information. Expired channels may likewise live until connection revalidation.
- Expiry denies new actions/joins but is not automatic row deletion. The owner
  can periodically run `delete from btv_private.rooms where expires_at < now();`
  in SQL Editor; memberships cascade. Separately manage old anonymous Auth users
  using Supabase's documented cleanup process. No scheduled cleanup is installed.
- Monitor Supabase Auth/database/Realtime usage and project availability. Free
  projects may pause during inactivity. Polling is low-frequency, not a guarantee
  against service downtime or lost browser credentials.

### Deferred release prerequisite: Turnstile

**Private testing may proceed without Turnstile. Before any public beta or
release, revisit this with the Cloudflare account owner.** The current setup
person has no Cloudflare account access. Create a widget for the actual game/test
hostnames, configure its secret in Supabase's Auth CAPTCHA settings, and supply
only its public site key to Vite. Never put the Turnstile secret in browser code.

**CAPTCHA token collection/submission is not implemented in this private-test
version.** A site-key setting alone does not enable protection. The frontend
must obtain a token and submit it in anonymous sign-in before Supabase CAPTCHA
enforcement is enabled, or new guest sign-ins will fail. This is a documented
release reminder, not a scheduled notification.

## Verification boundary

`npm test` runs scene/control tests, mocked transport/reconnect tests and an
embedded PostgreSQL (PGlite) test of the **actual migration**, including roles,
permissions, membership isolation, action conflicts, capacity, reset and pings.
It also runs two independent room clients against the SQL RPCs. PGlite is a
development-only dependency, never shipped to players. Its Auth and Realtime
infrastructure is stubbed: these checks cannot certify the hosted Supabase
gateway, WebSocket authorization or a real two-device session. Complete the
acceptance checklist after applying the migration on each new project.

On **2026-10-27**, the user reported successful private browser-session testing
against the configured hosted project: room membership, shared journal/door
updates, individual completion, host restart, pings, reconnect and late joining
with current progress. The initial Realtime connection failure recovered on
reload; its original cause was not established. Separate-device acceptance and
public-release protection remain outstanding. Closing a tab preserves its seat
as designed; host removal of abandoned seats is a future improvement.
