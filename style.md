# SaaS Interface Style Guide

**Version 1.0 — Flat, Calm, Intelligent Systems**

---

## 1. Design Philosophy (High-level Intent)

This interface design represents a **calm, intelligent, and trustworthy operating system for work**.

The UI should feel:

* **Quiet, not empty**
* **Structured, not rigid**
* **Premium, not flashy**
* **Helpful, not demanding attention**

The product should visually disappear as much as possible, allowing **content, actions, and user intent** to take center stage. The interface acts as a **soft framework** that organizes complexity without dramatizing it.

### Core principles

1. **Flat by default**
   Depth is communicated through spacing, grouping, and hierarchy — **not shadows**.
2. **Content-first**
   UI components exist to support information, not decorate it.
3. **Predictable structure**
   Once users learn one screen, they should intuitively understand others.
4. **Calm confidence**
   No aggressive colors, no visual noise, no over-stylization.

---

## 2. Visual Language (What it Should Look Like)

### Overall Appearance

* Predominantly **light background**
* Large areas of **white or near-white**
* Subtle, neutral color palette
* Rounded geometry, but **not playful**
* UI feels **editorial**, like a well-designed document system

This is **not** a dashboard-heavy, data-wall product. Even when data is present, it is presented as **readable content**, not charts-first.

---

## 3. Color System

### Base Colors

* **Background (Primary):**

  * Pure white or very light neutral (`#FFFFFF` → `#F8F9FB`)
* **Surface / Cards:**

  * Slightly darker than background (`#F2F4F7`)
* **Borders / Dividers:**

  * Very subtle neutral gray (`#E6E8EB`)

### Accent Colors

* Use **one primary accent color** only.
* Accent color is used for:

  * Primary actions
  * Selected states
  * Highlights inside content
* Accent color must be **soft but saturated**, never neon.

> Rule: If you hesitate between two accent colors, choose the quieter one.

### Semantic Colors

* Success, warning, error colors exist but:

  * Are **muted**
  * Never dominate a screen
  * Used sparingly and locally

---

## 4. Typography System

### Font Characteristics

* Sans-serif
* High legibility
* Neutral personality
* No decorative fonts

Examples (guidance only):

* Inter
* SF Pro
* Source Sans
* System font stacks are acceptable

### Hierarchy (Desktop)

* **Page Title:** 24–28px, Semi-bold
* **Section Title:** 16–18px, Medium
* **Body Text:** 14–15px, Regular
* **Meta / Helper Text:** 12–13px, Regular

### Typography Rules

* Line height is generous (1.4–1.6)
* Never center large blocks of text
* Avoid ALL CAPS except for very small labels
* Text color hierarchy:

  * Primary text: near-black
  * Secondary text: soft gray
  * Tertiary text: lighter gray

---

## 5. Layout & Spacing System

### Grid & Structure

* **Left navigation** is persistent on desktop
* Main content is centered and constrained
* Avoid full-width layouts unless necessary (tables, large lists)

### Spacing Scale (Example)

* XS: 4px
* S: 8px
* M: 12–16px
* L: 24px
* XL: 32–40px
* XXL: 64px+

Spacing is the **primary tool for hierarchy**.

> If something feels crowded, increase spacing — do not add visual elements.

---

## 6. Navigation Patterns

### Sidebar (Desktop)

* Light background
* Icons + labels
* Clear active state (background highlight, not underline)
* Collapsible sections allowed

### Mobile Navigation

* Bottom navigation or hamburger menu
* Same hierarchy as desktop, never a different IA
* Labels always visible on primary navigation

---

## 7. Cards & Containers

### Card Style

* Flat
* Rounded corners (8–12px)
* No shadows by default
* Use **background contrast** to separate cards from page

### When Shadows Are Allowed

* Only for:

  * Modals
  * Floating menus
  * Temporary overlays
* Shadows must be:

  * Soft
  * Low opacity
  * Never stacked

> Shadows are **not a layout tool**. Spacing is.

---

## 8. Buttons & Actions

### Button Types

1. **Primary**

   * Accent color background
   * Used once per screen where possible
2. **Secondary**

   * Neutral background or outline
3. **Tertiary**

   * Text-only

### Button Rules

* Rounded (same radius as cards)
* Clear label (verb + object)
* No icon-only buttons unless universally understood

---

## 9. Forms & Inputs

### Input Fields

* Flat
* Light border
* Clear focus state (border color change)
* No heavy inset shadows

### Labels

* Always visible
* Never rely on placeholder alone
* Helper text below input when needed

---

## 10. Content Types: When to Use What

### Text (Default)

Use text when:

* Explaining concepts
* Summarizing results
* Giving guidance or feedback

### Tables

Use tables when:

* Comparing multiple items
* Showing structured data
* Allowing scanning, not storytelling

### Graphs

Use graphs **only** when:

* Trends over time matter
* Visual comparison is faster than reading numbers
* You can explain the insight in one sentence

> If the graph does not add clarity, remove it.

### Images

Use images when:

* They add context (people, real-world examples)
* They humanize content
* They explain something visual

Never use images as decoration.

---

## 11. Motion & Transitions

* Subtle
* Fast
* Purposeful

Examples:

* Fade in content
* Slide small distances
* No bouncing or elastic effects

Motion should **reduce cognitive load**, not increase it.

---

## 12. Emotional Intent (Why This Design Exists)

This design should convey:

* **Trust** → Users feel safe putting important work here
* **Clarity** → The product feels easy even when powerful
* **Calm productivity** → No stress, no urgency unless necessary
* **Competence** → The product feels well thought-out and mature

Users should feel:

> “This tool understands my work and respects my time.”

---

## 13. Example: Basic Component Composition

### Example: Content Card

```
[ Card Container ]
  - Title (Medium, 16px)
  - Short description (Regular, 14px)
  - Meta info (12px, gray)
  - Primary action (button or link)
```

Rules:

* One idea per card
* No more than one primary action
* Whitespace around card > content inside card

---

## 14. Adaptation for Our SaaS (Differences from Inspiration)

Since our SaaS is in a **different sector**, we explicitly:

### Removed

* Domain-specific terminology
* Industry-specific iconography
* Overly narrative onboarding content

### Modified

* Data presentation to match our domain
* Action labels to reflect our workflows
* Navigation structure aligned with our product logic

### Added

* Components specific to our SaaS (e.g. workflows, states, entities)
* Domain-relevant empty states
* Contextual guidance tailored to our users

> The **style remains**, the **content changes**.

---

## 15. Final Rules for Designers & AI

* Default to **less**
* If unsure, remove rather than add
* Never use shadows to fix spacing problems
* Respect hierarchy over decoration
* Design for clarity first, aesthetics second

This system is successful when:

> Users notice the **work**, not the interface.