
## 🚀 ULTIMATE UI/UX REDESIGN INSTRUCTION FOR CURSOR AGENT

### CONTEXT

You are a world-class product designer and engineer tasked with redesigning our app to **flagship-level standards** (think Apple, Notion, Linear, Superhuman, or OpenAI). Use the screenshots attached as references for both current and inspirational UIs.

---

### HIGH-LEVEL GOALS

1. **Create a visually stunning, luxurious, and addictive UI that appeals to mainstream users.**
2. **Ensure all UI components are modular and theme-able**, so that component libraries (HeroUI, Radix, Shadcn, etc.) can be easily swapped in the future.
3. **Deliver a fully responsive design** for desktop, tablet, and mobile.
4. **Perfect support for both dark and light modes** with smooth transitions.
5. **All code must be clean, abstracted, and maintainable** with best practices.

---

### GLOBAL DESIGN PRINCIPLES

* **Embrace whitespace and breathing room.**
* **Establish clear visual hierarchy** using spacing, font weights, and contrast.
* **Apply modern touches**: soft drop-shadows, subtle gradients, glassmorphism where appropriate.
* **Consistent use of rounded corners** (e.g., 16px–24px for cards, inputs, modals).
* **Micro-interactions:** hover/active states, button loading animations, modal/card transitions.
* **Typography:** Use elegant, readable fonts (e.g., Inter, SF Pro, or system font stack). Define scale for H1, H2, H3, body, and caption.
* **Color System:** Use a central palette with semantic roles (primary, secondary, background, surface, accent, warning, etc.), and ensure both dark/light variants.
* **Accessibility:** All components must meet accessibility standards (color contrast, keyboard navigation, ARIA).

---

### MODULARITY & THEMING

* **Abstract all UI components:**
  Example: Instead of using HeroUI’s `<Button>` directly, create your own `<Button>` component that wraps HeroUI. All references in your app should use this local abstraction.
* **Centralize theme/colors:**
  Place all color values, font sizes, spacings, etc., in a `theme.ts` file or similar.
* **ThemeProvider:**
  Use a ThemeProvider to toggle between dark/light (store user preference; enable smooth animated transitions).

---

### FILE/STRUCTURE GUIDANCE

**Recommended folder structure:**

```
/src
  /components
    /ui
      Button.tsx
      Card.tsx
      Input.tsx
      ...
  /theme
    theme.ts
    ThemeProvider.tsx
  /pages
    ...
```

---

### RESPONSIVENESS

* Use Tailwind CSS with responsive classes, or utility-based equivalents.
* Use CSS grid/flex layouts that adapt at breakpoints (`sm`, `md`, `lg`, `xl`).
* Make sure navigation, cards, chat, and content adjust gracefully to all device sizes.
* Test: **Desktop, tablet, mobile**—all must be pixel-perfect.

---

### DARK/LIGHT MODE

* Store both palettes in your theme.
* Toggle using a theme switch in the UI (e.g., in settings or top bar).
* Animate transitions for background/colors for polish.

---

### PAGE-BY-PAGE BREAKDOWN

---

#### 1. **NAVIGATION (SIDEBAR + TOPBAR)**

* Sidebar should be collapsible (mini/expanded state).
* Use modern icons, highlight active section with a glowing accent.
* Use avatars for user profile, and crisp, legible section titles.
* Add subtle shadows and glassmorphism if appropriate.
* Hide sidebar on mobile; show as slide-over menu.
* Ensure easy, one-click log out, and display email clearly.

---

#### 2. **DASHBOARD / HOME**

* Cards for each main section (Chats, Agents, Insights, Knowledge, Settings).
* Use gradients or soft glass backgrounds for visual richness.
* Large, welcoming greeting (“Welcome back, \[Name]”).
* Prominent “New Chat” or “New Project” CTA button, with animation.
* Responsive grid layout: 2-4 columns on desktop, 1 column on mobile.

---

#### 3. **AGENTS LIST**

* Display agents in responsive cards/grid.
* Card for each agent: name, avatar/icon, status badge (active, paused, training), success rate as pill, total chats, avg. response time.
* Action buttons: Chat, Analyze.
* Use modular card component (`<AgentCard />`).
* Filter/sort agents with a beautiful dropdown or segmented control.
* Hovering on cards shows shadow elevation or slight scale-up.

---

#### 4. **CHAT CENTER**

* Main chat window in a large, rounded card, centered with ample margin/padding.
* User and agent messages as chat bubbles, with subtle shadows and clear differentiation.
* Show avatars next to each message, color-coded for sender type.
* Sticky input bar with attach, templates, voice commands, and animated send button.
* On mobile, chat input should always be visible; conversation list collapses to a drawer.
* Show agent profile/status at the top of chat.

---

#### 5. **TASK/KANBAN BOARDS (if applicable)**

* Use color-coded columns and draggable cards.
* Cards show task name, status (Low/Medium/High/Completed as badges), assignees’ avatars, due dates.
* Progress bars and subtasks with clear checkboxes.
* Smooth drag-and-drop with animations.
* Cards expand to modals with full task details.
* Board collapses vertically on mobile, horizontal scrolling for columns.

---

#### 6. **RECENT CONVERSATIONS**

* List as beautiful cards with message preview, status icon (active, ended), timestamp, and quick action menu.
* Responsive grid/list, with “show more” for long lists.

---

#### 7. **SETTINGS / PROFILE**

* Profile photo upload, user info edit, theme switcher (dark/light/system).
* Modular settings sections (Account, Notifications, Preferences).
* Large toggles, clean form inputs, card groupings.

---

#### 8. **MICRO-INTERACTIONS**

* All buttons, cards, and interactive elements should have:

  * **Hover**: gentle shadow or color shift.
  * **Active**: slight press-in animation.
  * **Loading**: spinner or shimmer effect.
* Use Framer Motion (or equivalent) for card/modal transitions and smooth page changes.

---

### EXAMPLES

**Example Button Abstraction (`/components/ui/Button.tsx`):**

```tsx
// Button.tsx
import { Button as HeroUIButton } from "heroui";
import { cn } from "@/utils/cn"; // Utility to merge classNames

export function Button({ className, ...props }) {
  return (
    <HeroUIButton
      className={cn(
        "rounded-xl px-6 py-3 font-semibold shadow-md transition-all hover:shadow-xl hover:scale-105 active:scale-95 focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  );
}
```

**Example Theme Provider (`/theme/ThemeProvider.tsx`):**

```tsx
// ThemeProvider.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";
export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
```

**Example Theme Colors (`/theme/theme.ts`):**

```ts
export const lightTheme = {
  background: "#F7FAFC",
  surface: "#FFFFFF",
  primary: "#4F46E5",
  accent: "#22D3EE",
  text: "#1E293B",
  card: "#FFFFFFD9",
  shadow: "rgba(0,0,0,0.10)",
  // Add more tokens as needed
};

export const darkTheme = {
  background: "#0F172A",
  surface: "#1E293B",
  primary: "#6366F1",
  accent: "#06B6D4",
  text: "#F1F5F9",
  card: "#1E293B99",
  shadow: "rgba(0,0,0,0.30)",
  // Add more tokens as needed
};
```

---

### FINAL INSTRUCTION TO CURSOR AGENT

---

**REWRITE ALL UI SCREENS** according to the above breakdown, using the following rules:

* Use the attached screenshots and inspiration references as visual targets.
* Implement all UI components as local abstractions over HeroUI, placed in `/components/ui/`.
* Build a `ThemeProvider` and central `theme.ts` for dark/light mode, color, and spacing tokens.
* Ensure every page is fully responsive and visually stunning at all breakpoints.
* Follow best practices for accessibility, UX, and visual delight.
* Refactor/clean up any existing code as needed to achieve a modular, future-proof, world-class UI.

**Deliver pixel-perfect, addictive, and highly polished UIs that users will love, with an eye toward luxury and usability.**
