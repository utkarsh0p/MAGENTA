# STYLES.md

## Purpose

This file stores the visual direction for the HumanTouch frontend.

Use it when implementing UI, choosing colors, writing interface copy, building
layouts, or checking whether a component feels consistent with the product.

HumanTouch is an internal company agent management app. The interface should
feel capable, structured, and admin-ready rather than decorative or
marketing-led.

## Preferred HumanTouch Direction

The future HumanTouch UI should move away from the older Claude-inspired theme
and use the provided `story-scroll` reference as style inspiration. Do not apply
the story-scroll component directly unless requested; preserve its visual
language as inspiration for later UI redesign work.

Core direction:

- product feel: bold, editorial, confident, and structured, while still working
  as an admin webapp
- use high-contrast full-surface sections and panels rather than soft
  Claude-like beige chat surfaces
- prefer strong color blocking, clear horizontal rules, uppercase section
  labels, and large typographic hierarchy
- keep the operational HumanTouch app structure intact: agent management,
  assignments, sessions, chat, and integrations
- avoid making the app look like a generic Claude clone or a plain chatbot

Reference palette from the provided component:

- signal orange: `#fd5200`
- true black: `#000`
- warm off-white: `#F5F0E8`
- strong blue: `#1A3DE8`
- white foreground: `#fff`

## Product Feel

The app should feel:

- focused
- trustworthy
- admin-ready
- confident
- structured
- built for repeated daily work

Avoid:

- oversized marketing heroes in the app shell
- decorative gradients as the main visual identity
- playful or consumer-app styling
- busy card-heavy dashboards
- vague AI hype language
- UI copy that over-explains obvious controls

## Layout Direction

The core app should use a practical workspace layout:

- left sidebar for sessions, navigation, or agents
- main panel for chat or admin workflow
- compact top/header area for current user, current agent, and provider state
- clear empty states
- visible loading and error states
- room for future execution/progress state

Use full-page application surfaces instead of landing-page sections.

Do not put cards inside other cards. Use cards only for repeated entities,
modals, compact settings groups, and clearly framed tools.

## Color System

Use the reference palette with a small set of semantic accents.

Recommended base:

- page background: true black `#000` or warm off-white `#F5F0E8`, depending on
  the surface
- primary high-contrast surface: true black `#000`
- secondary surface: warm off-white `#F5F0E8`
- primary action: signal orange `#fd5200`
- strong accent: blue `#1A3DE8`
- foreground on dark surfaces: white `#fff`
- borders: crisp dark or light dividers that reinforce structure

Recommended semantic accents:

- success: green
- warning: amber
- danger: red
- info/progress: blue

Example token intent:

```text
background: app shell and page base
surface: panels, cards, inputs, menus
surface-muted: secondary panels and inactive rows
border: dividers and component outlines
text: main readable text
text-muted: labels, descriptions, timestamps
primary: main actions and active state
primary-muted: selected rows or subtle active backgrounds
success: connected, completed, available
warning: needs attention
danger: destructive actions and errors
info: streaming, progress, or neutral status
```

Avoid one-note palettes. The app should not collapse into a single orange,
beige, blue, or charcoal theme.

## Typography

Use a modern sans-serif such as `Plus Jakarta Sans`, `Inter`, or a similar
geometric UI font.

Typography guidance:

- favor bold uppercase labels for section markers and compact metadata
- use large, tight, confident headings where the screen calls for a major
  product state or page title
- keep dense admin controls smaller and more utilitarian
- do not use oversized display text inside tables, forms, sidebars, buttons, or
  compact panels
- chat text should be readable, not oversized
- metadata should be smaller and muted, but still legible

Do not scale font sizes directly with viewport width. Keep letter spacing at
normal unless a specific component needs subtle label treatment.

## Buttons And Controls

Controls should be familiar and efficient:

- icon buttons for common actions like new, edit, delete, settings, send, close
- text buttons for clear commands
- segmented controls for mode switching
- toggles for connected/disconnected provider state
- checkboxes for multi-select permissions or assignments
- menus for compact option sets
- tabs for peer-level views
- inputs and textareas for agent details and prompts

Use destructive styling only for destructive actions.

Buttons should not resize when labels, icons, or loading states change.

## Chat UI

The chat experience should support:

- current agent indicator
- session title or timestamp
- visible user and assistant message separation
- streaming response state
- retry or error affordance
- disabled send state when input is empty or request is in progress
- preserved history from backend session data

Keep chat bubbles and message surfaces modest. Avoid oversized rounded shapes or
decorative assistant avatars unless they add real clarity.

## Agent Management UI

Agent management screens should make these concepts visible:

- agent name
- status
- description or role
- assigned users
- assigned roles
- allowed tools, when available
- generated `system_prompt`, when an admin needs to inspect or edit it
- structured `agent_info`

Prefer tables or compact lists for admin scanning. Use detail panels or drawers
for editing when that keeps the workflow faster.

## Provider Integration UI

Keep HumanTouch login identity separate from connected provider accounts.

Provider controls should:

- show the current HumanTouch user email nearby
- show each provider as disconnected or connected
- show connected accounts as `Connected as <provider email/account id>`
- use an on/off toggle pattern
- avoid implying provider email must match the HumanTouch login email

Use success styling for connected state and neutral styling for disconnected
state. Use danger styling only for explicit disconnect confirmation or failure.

## Copy Style

Interface copy should be direct and product-specific.

Use:

- `Agents`
- `Sessions`
- `Assignments`
- `Connected as ...`
- `Create agent`
- `Assign users`
- `Assign roles`
- `New session`
- `Current agent`

Avoid:

- AI hype claims
- generic marketing phrases
- long instructional text in the app UI
- copy that suggests permissions are controlled by prompts alone

## Responsive Behavior

The app should work on desktop and mobile:

- desktop can use persistent sidebars
- mobile should collapse navigation and session lists
- chat input must remain reachable
- text must not overlap controls
- tables should become lists or horizontally manageable layouts
- fixed-format controls should have stable dimensions

Check long names, emails, role labels, and agent names so they wrap or truncate
cleanly.

## Accessibility

Use accessible defaults:

- sufficient contrast
- visible focus states
- semantic buttons and links
- labels for form controls
- keyboard-reachable menus and dialogs
- clear disabled states
- readable error text

Do not rely only on color to communicate provider state, destructive state, or
permission status.

## Story Scroll Reference Notes

If the `story-scroll` component is actually integrated, it belongs under
`FRONTEND/components/ui/story-scroll.tsx`.

It requires `gsap` and `@gsap/react`. The component is client-only and uses
`ScrollTrigger`, `useGSAP`, `window.matchMedia`, and reduced-motion handling.

It should not replace the core app shell by default; it is better suited to an
onboarding, intro, or showcase flow.

Tailwind setup should keep global font variables in the app stylesheet, but
avoid importing animation packages unless they are actually installed and used.

## Legacy Claude Reference

The notes below are historical reference only. They should not be treated as the
desired future HumanTouch visual direction unless explicitly requested.

## Claude Typography Reference

Verified from the live Claude product site by inspecting loaded fonts and
computed styles on `https://claude.com/product/overview`.

- UI/body font: `"Anthropic Sans", Arial, sans-serif`
- Display/hero font: `"Anthropic Serif", Georgia, serif`
- Mono/code font: `"Anthropic Mono"`

Verified font asset URLs:

- `https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/69971989be3c6573c3128fd9_AnthropicSans-Roman-Web.woff2`
- `https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/6997199fab1923a705f0042d_AnthropicSerif-Roman-Web.woff2`
- `https://cdn.prod.website-files.com/6889473510b50328dbb70ae6/699719b721a24ad1b6ce2c47_AnthropicMono.woff2`

Computed style snapshot from the live page:

- `body` font family: `"Anthropic Sans", Arial, sans-serif`
- `body` background: `rgb(250, 249, 245)`
- `body` text color: `rgb(20, 20, 19)`
- `h1` font family: `"Anthropic Serif", Georgia, sans-serif`
- `h1` font size: `47.5px`
- `h1` font weight: `500`

## Implementation Notes

When Tailwind is available, define shared values through theme tokens or
component primitives instead of scattering one-off colors throughout the app.

Before considering a UI task complete:

- check desktop and mobile layouts
- check long text and email rendering
- check loading, empty, error, and unauthorized states
- make sure colors do not collapse into a single-hue theme
- verify the UI still feels like a working internal app, not a landing page
