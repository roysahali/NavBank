# SKILL.md — Accessibility (WCAG 2.2 AA)

## Overview
Complete coding standards for WCAG 2.2 Level AA conformance. Apply to every user-facing component and page. WCAG 2.2 is the current standard (October 2023) — the legal baseline in the EU (EAA June 2025), UK, and most of North America. These rules prevent violations at write time rather than catching them in testing.

**Standard:** WCAG 2.2 · **Target level:** AA · **Principles:** Perceivable · Operable · Understandable · Robust

---

## Principle 1 — Perceivable

### 1.1.1 Non-text content (A)
All images, icons, charts, and graphics need a text alternative.

```html
<!-- Informative image -->
<img src="chart.png" alt="Bar chart showing Q3 revenue up 23% year-on-year" />

<!-- Decorative image — empty alt, no role needed -->
<img src="divider.svg" alt="" />

<!-- Icon button — label the function, not the icon -->
<button aria-label="Close dialog">
  <svg aria-hidden="true" focusable="false">...</svg>
</button>

<!-- Complex image (chart/diagram) — short alt + long description -->
<img src="architecture.png" alt="System architecture diagram" aria-describedby="arch-desc" />
<p id="arch-desc">The system has three layers: presentation, business logic, and data...</p>

<!-- CAPTCHA — must offer an alternative modality -->
<img src="captcha.png" alt="Type the characters shown" />
<a href="/audio-captcha">Audio alternative</a>
```

### 1.2.1–1.2.5 Time-based media (A/AA)
| Criterion | Requirement | Level |
|-----------|-------------|-------|
| 1.2.1 | Transcript for audio-only; text/audio track for video-only | A |
| 1.2.2 | Closed captions for all prerecorded video with audio | A |
| 1.2.3 | Audio description OR transcript for prerecorded video | A |
| 1.2.4 | Live captions for live video with audio | AA |
| 1.2.5 | Audio description track for all prerecorded video | AA |

```html
<!-- Video with captions and audio description -->
<video controls>
  <source src="demo.mp4" type="video/mp4" />
  <track kind="captions" src="demo-captions.vtt" srclang="en" label="English captions" default />
  <track kind="descriptions" src="demo-descriptions.vtt" srclang="en" label="Audio descriptions" />
</video>
```

### 1.3.1 Info and relationships (A)
Structure must be conveyed through markup, not just visually.

```html
<!-- ✅ Use semantic elements -->
<nav aria-label="Main navigation"><ul><li>...</li></ul></nav>
<main><article><h1>Title</h1></article></main>
<aside aria-label="Related links">...</aside>
<footer>...</footer>

<!-- ✅ Tables — always use headers -->
<table>
  <caption>Q3 Sales by Region</caption>
  <thead><tr><th scope="col">Region</th><th scope="col">Revenue</th></tr></thead>
  <tbody><tr><td>North</td><td>£1.2m</td></tr></tbody>
</table>

<!-- ❌ Never convey structure with CSS alone -->
<div style="font-size:24px;font-weight:bold">This looks like a heading</div>
```

### 1.3.2 Meaningful sequence (A)
Reading/tab order in the DOM must match visual order.

```css
/* ❌ Never use CSS order to reorder visually without matching DOM order */
.container { display: flex; }
.item:first-child { order: 3; } /* breaks screen reader and keyboard order */

/* ✅ DOM order = visual order */
```

### 1.3.3 Sensory characteristics (A)
Instructions must not rely on shape, colour, size, location, or sound alone.

```html
<!-- ❌ Fails -->
<p>Click the green button to continue</p>
<p>See the form on the right</p>

<!-- ✅ Passes -->
<p>Click the <strong>Continue</strong> button to proceed</p>
<p>Fill in the registration form below</p>
```

### 1.3.4 Orientation (AA)
Do not lock content to portrait or landscape. Support both orientations.

```css
/* ❌ Never lock orientation */
@media (orientation: landscape) { body { display: none; } }

/* ✅ Design must work in both orientations */
/* Exception: essential use case (e.g. piano app) must be documented */
```

### 1.3.5 Identify input purpose (AA)
Use `autocomplete` attributes on personal data fields.

```html
<input type="text" name="fname" autocomplete="given-name" />
<input type="text" name="lname" autocomplete="family-name" />
<input type="email" name="email" autocomplete="email" />
<input type="tel" name="phone" autocomplete="tel" />
<input type="text" name="address" autocomplete="street-address" />
<input type="text" name="postcode" autocomplete="postal-code" />
<input type="text" name="cc-name" autocomplete="cc-name" />
```

### 1.4.1 Use of colour (A)
Colour must not be the only means of conveying information.

```html
<!-- ❌ Colour alone -->
<span style="color:red">Required field</span>

<!-- ✅ Colour + text + icon -->
<span style="color:#C00">
  <svg aria-hidden="true"><!-- asterisk icon --></svg>
  Required
</span>

<!-- ✅ Error state — colour + border + text + icon -->
<input aria-invalid="true" style="border-color:#C00" />
<span role="alert" style="color:#C00">
  <svg aria-hidden="true"><!-- warning icon --></svg>
  Email address is required
</span>
```

### 1.4.2 Audio control (A)
Any audio that plays automatically for more than 3 seconds must have a pause/stop control, or the volume must be controllable independently of the system volume.

```html
<!-- If audio autoplays, provide a stop control immediately -->
<audio autoplay id="bg-audio" src="background.mp3"></audio>
<button onclick="document.getElementById('bg-audio').pause()">
  Stop background audio
</button>
```

### 1.4.3 Contrast minimum (AA)
- Normal text (< 18px regular, < 14px bold): **4.5:1** minimum
- Large text (≥ 18px regular, ≥ 14px bold): **3:1** minimum
- Decorative text and logotypes: no requirement

```css
/* ✅ Check all text/background combinations */
/* Tools: WebAIM Contrast Checker, Colour Contrast Analyser */
color: #595959; /* on white #fff = 7:1 ✅ */
color: #767676; /* on white #fff = 4.54:1 ✅ */
color: #777;    /* on white #fff = 4.48:1 ❌ fails */
```

### 1.4.4 Resize text (AA)
Text must be resizable up to 200% without loss of content or functionality. No fixed-height containers that clip text.

```css
/* ✅ Use relative units */
font-size: 1rem;       /* scales with user preference */
line-height: 1.5;      /* relative, not px */
padding: 0.5em 1em;    /* relative to font size */

/* ❌ Fixed heights that clip text */
.card { height: 120px; overflow: hidden; } /* fails if text is enlarged */

/* ✅ Use min-height instead */
.card { min-height: 120px; }
```

### 1.4.5 Images of text (AA)
Use real text styled with CSS instead of images containing text.

```html
<!-- ❌ Image of text — cannot be resized, recoloured, translated -->
<img src="heading-logo-text.png" alt="Welcome to Our Service" />

<!-- ✅ Real text styled with CSS -->
<h1 class="logo-text">Welcome to Our Service</h1>
```

### 1.4.10 Reflow (AA)
Content must reflow at 320px width (equivalent to 400% zoom on 1280px screen) without horizontal scrolling. Exception: content that requires 2D layout (maps, data tables).

```css
/* ✅ Use responsive CSS — no fixed widths wider than viewport */
.container { max-width: 100%; }
img { max-width: 100%; height: auto; }

/* ✅ Test: set browser to 320px width — no horizontal scroll */

/* ❌ Fixed-width layouts that break at 320px */
.sidebar { width: 300px; float: left; }
.content { width: 700px; float: right; }
```

### 1.4.11 Non-text contrast (AA)
UI components (buttons, inputs, checkboxes, focus indicators) and meaningful graphics need **3:1** contrast against adjacent colour.

```css
/* ✅ Input border: must be 3:1 against background */
input { border: 1px solid #767676; } /* on white = 4.54:1 ✅ */

/* ✅ Button outline/border */
button { border: 2px solid #595959; } /* on white = 7:1 ✅ */

/* ✅ Focus ring — must be visible, 3:1 against adjacent colours */
:focus-visible {
  outline: 2px solid #005FCC;  /* on white = 8.59:1 ✅ */
  outline-offset: 2px;
}

/* ❌ Invisible focus ring */
:focus { outline: none; }
```

### 1.4.12 Text spacing (AA)
Content must not lose information when all of these are applied simultaneously:
- Line height: 1.5× font size
- Letter spacing: 0.12× font size
- Word spacing: 0.16× font size
- Spacing after paragraphs: 2× font size

```css
/* ✅ Never use fixed heights on text containers */
/* ✅ Test with the Text Spacing Bookmarklet */

/* ❌ Containers that break with text spacing */
.truncate { height: 48px; overflow: hidden; line-height: 1.2; }
/* Fails — 1.5 line-height will exceed 48px */
```

### 1.4.13 Content on hover or focus (AA)
Additional content triggered by hover or focus (tooltips, popups) must be:
- **Dismissible** — close without moving pointer (e.g. Escape key)
- **Hoverable** — pointer can move over the triggered content
- **Persistent** — stays until dismissed, pointer leaves, or focus moves

```typescript
// ✅ Tooltip that stays on hover and is dismissible
function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && setVisible(false);
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div role="tooltip" onMouseEnter={() => setVisible(true)}>
          {content}
        </div>
      )}
    </div>
  );
}
```

---

## Principle 2 — Operable

### 2.1.1 Keyboard (A)
All functionality must be available by keyboard alone. No keyboard traps.

```typescript
// ✅ Custom interactive elements need keyboard handlers
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Activate
</div>

// ✅ Custom select/listbox
<ul role="listbox" onKeyDown={handleListKeyDown}>
  {options.map(opt => (
    <li role="option" aria-selected={opt.selected} tabIndex={-1}>
      {opt.label}
    </li>
  ))}
</ul>
```

### 2.1.2 No keyboard trap (A)
Focus must never get stuck inside a component (except intentional modal traps).

```typescript
// ✅ Modal — intentional trap, but Escape must escape
function Modal({ onClose, children }) {
  useEffect(() => {
    const firstFocusable = modalRef.current.querySelector(focusableSelector);
    firstFocusable?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') trapFocus(e, modalRef.current); // cycle within modal
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### 2.1.4 Character key shortcuts (A)
Single character keyboard shortcuts (letters, numbers, punctuation) must be remappable, toggleable, or only active when the component has focus.

```typescript
// ❌ Global single-key shortcut with no way to disable
document.addEventListener('keydown', (e) => {
  if (e.key === 's') saveDocument(); // breaks for speech input users
});

// ✅ Require modifier key, or provide a way to disable
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 's') saveDocument(); // modifier required
});
```

### 2.2.1 Timing adjustable (A)
Time limits must be: turnable off, adjustable (at least 10× more time), or warn with 20 seconds to extend.

```typescript
// ✅ Session timeout warning
function SessionTimeoutWarning({ secondsRemaining, onExtend }) {
  return (
    <div role="alertdialog" aria-modal="true"
         aria-label="Session expiring"
         aria-describedby="timeout-msg">
      <p id="timeout-msg">
        Your session expires in {secondsRemaining} seconds.
      </p>
      <button onClick={onExtend}>Extend session</button>
    </div>
  );
}
// Show warning with 20+ seconds remaining, extend by at least 10× remaining time
```

### 2.2.2 Pause, stop, hide (A)
Moving, blinking, or scrolling content that lasts more than 5 seconds must have a pause/stop/hide mechanism.

```html
<!-- ✅ Auto-playing carousel must have pause -->
<div role="region" aria-label="News carousel">
  <div aria-live="off" id="carousel-content">...</div>
  <button aria-controls="carousel-content" onclick="togglePause()">
    Pause carousel
  </button>
</div>
```

### 2.3.1 Three flashes or below threshold (A)
Content must not flash more than 3 times per second, or the flash must be below the general flash and red flash thresholds.

```
Rule: If content flashes, ensure it flashes ≤ 3 times/second.
Test: PEAT (Photosensitive Epilepsy Analysis Tool) for video content.
For web animations: keep transition durations > 333ms.
```

### 2.4.1 Bypass blocks (A)
Provide a skip navigation link to bypass repeated blocks (header, nav) and jump to main content.

```html
<!-- First element in <body> — visually hidden until focused -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- ... navigation, header ... -->

<main id="main-content">
  <!-- page content -->
</main>
```

```css
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 999;
  padding: 8px 16px;
  background: #000;
  color: #fff;
}
.skip-link:focus {
  left: 50%;
  transform: translateX(-50%);
  top: 8px;
}
```

### 2.4.2 Page titled (A)
Every page must have a unique, descriptive `<title>`.

```html
<!-- ✅ Format: Page name — Site name -->
<title>Shopping cart (3 items) — Acme Store</title>
<title>Edit profile — Acme Dashboard</title>

<!-- ❌ Generic -->
<title>Page</title>
<title>Acme</title>
```

### 2.4.3 Focus order (A)
Focus order must be logical — matches visual/reading order. DOM order determines tab order.

```html
<!-- ✅ DOM order matches reading order -->
<h1>Title</h1>
<nav>Navigation</nav>
<main>Content</main>

<!-- ❌ tabindex > 0 creates unpredictable order -->
<button tabindex="3">First visually</button>
<button tabindex="1">Second visually</button>
<button tabindex="2">Third visually</button>
```

### 2.4.4 Link purpose in context (A)
Link text (alone or with context) must describe the destination.

```html
<!-- ❌ Meaningless out of context -->
<a href="/report.pdf">Click here</a>
<a href="/article">Read more</a>

<!-- ✅ Descriptive -->
<a href="/report.pdf">Download Q3 annual report (PDF, 2.4MB)</a>
<a href="/article">Read more about WCAG 2.2 <span class="sr-only">accessibility guidelines</span></a>
```

### 2.4.5 Multiple ways (AA)
Provide more than one way to find a page within a website (except where a step in a process).

```
✅ Provide at least two of:
- Search functionality
- Site map
- Table of contents
- Navigation menu
- Breadcrumbs
- Related links
```

### 2.4.6 Headings and labels (AA)
Headings and form labels must be descriptive. Not just "Section 1" or "Field".

```html
<!-- ❌ Vague -->
<h2>Information</h2>
<label for="f1">Field 1</label>

<!-- ✅ Descriptive -->
<h2>Billing address</h2>
<label for="billing-city">City</label>
```

### 2.4.7 Focus visible (AA)
Keyboard focus must be visible — never suppress the focus indicator.

```css
/* ❌ Never do this */
* { outline: none; }
:focus { outline: none; }
button:focus { outline: 0; }

/* ✅ Style focus visibly */
:focus-visible {
  outline: 2px solid #005FCC;
  outline-offset: 2px;
  border-radius: 2px;
}

/* ✅ Custom focus style for buttons */
button:focus-visible {
  box-shadow: 0 0 0 3px #005FCC;
  outline: none; /* OK when replacing with box-shadow */
}
```

### 2.4.11 Focus not obscured — minimum (AA) ⭐ NEW IN WCAG 2.2
A focused component must not be entirely hidden by sticky headers, cookie banners, or chat widgets.

```css
/* ✅ Account for sticky header height in scroll margin */
:target { scroll-margin-top: 80px; } /* sticky header height */

/* ✅ Ensure sticky elements don't cover focused items */
.sticky-header { height: 64px; position: sticky; top: 0; z-index: 100; }

/* In JavaScript — when focusing programmatically, account for offset */
element.focus();
const rect = element.getBoundingClientRect();
if (rect.top < 80) window.scrollBy(0, rect.top - 80 - 8);
```

### 2.5.1 Pointer gestures (A)
All functionality using multi-point or path-based gestures (pinch, swipe) must have a single-pointer alternative.

```typescript
// ❌ Swipe-only carousel — no button alternative
<div onTouchMove={handleSwipe}>...</div>

// ✅ Swipe + button alternative
<button onClick={previous} aria-label="Previous slide">‹</button>
<div onTouchMove={handleSwipe} aria-label="Slides" role="region">...</div>
<button onClick={next} aria-label="Next slide">›</button>
```

### 2.5.2 Pointer cancellation (A)
For single-pointer actions: use the up-event (mouseup/touchend), allow cancellation, or confirm destructive actions.

```typescript
// ❌ Action fires on mousedown — cannot be cancelled
<button onMouseDown={deleteAccount}>Delete account</button>

// ✅ Action fires on click (mouseup) — user can move pointer off to cancel
<button onClick={deleteAccount}>Delete account</button>

// ✅ Or use up-event explicitly for custom components
element.addEventListener('pointerup', handleAction);
```

### 2.5.3 Label in name (A)
The accessible name of an element must contain the visible label text.

```html
<!-- ❌ Accessible name doesn't contain visible text -->
<button aria-label="Close the navigation drawer">Menu</button>
<!-- Screen reader says "Close the navigation drawer", visible says "Menu" — mismatch -->

<!-- ✅ Accessible name contains the visible label -->
<button aria-label="Close menu">Menu</button>
<!-- Or simply don't override the label -->
<button>Close</button>
```

### 2.5.4 Motion actuation (A)
Functionality triggered by device motion (shake, tilt) must have a UI alternative and be disableable.

```typescript
// ✅ Provide both motion AND UI alternative
function UndoButton() {
  // UI alternative for shake-to-undo
  return <button onClick={undo}>Undo last action</button>;
}

// ✅ Allow users to disable motion-triggered actions
const [motionEnabled, setMotionEnabled] = useState(
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches
);
```

### 2.5.7 Dragging movements (AA) ⭐ NEW IN WCAG 2.2
All functionality using dragging (drag-and-drop) must have a single-pointer alternative.

```typescript
// ❌ Drag-only reordering
<DragDropContext onDragEnd={reorder}>
  <Draggable>...</Draggable>
</DragDropContext>

// ✅ Drag + button alternative
function ReorderableItem({ item, index, total, onMove }) {
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
          <span>{item.label}</span>
          <button onClick={() => onMove(index, index - 1)} disabled={index === 0}
                  aria-label={`Move ${item.label} up`}>↑</button>
          <button onClick={() => onMove(index, index + 1)} disabled={index === total - 1}
                  aria-label={`Move ${item.label} down`}>↓</button>
        </div>
      )}
    </Draggable>
  );
}
```

### 2.5.8 Target size minimum (AA) ⭐ NEW IN WCAG 2.2
Interactive targets must be at least **24×24 CSS pixels**, or have sufficient spacing so the 24×24 area doesn't intersect another target.

```css
/* ✅ Minimum touch/click target size */
button, a, [role="button"], input[type="checkbox"], input[type="radio"] {
  min-width: 24px;
  min-height: 24px;
}

/* ✅ Preferred — 44×44px for comfortable touch targets */
.nav-link { min-height: 44px; display: flex; align-items: center; padding: 0 16px; }
.icon-button { width: 44px; height: 44px; }

/* ✅ If target is smaller, ensure 24px spacing to nearest target */
.inline-link { /* 20px target */ margin: 2px; /* 2px × 2 sides = 24px clearance */ }
```

---

## Principle 3 — Understandable

### 3.1.1 Language of page (A)
Every HTML document must declare its language.

```html
<html lang="en">
<html lang="en-GB">
<html lang="fr">
<html lang="ar" dir="rtl">
```

### 3.1.2 Language of parts (AA)
Inline content in a different language must declare it.

```html
<p>The French for hello is <span lang="fr">bonjour</span>.</p>
<blockquote lang="de" cite="https://example.com">
  <p>Ich bin ein Berliner.</p>
</blockquote>
```

### 3.2.1 On focus (A)
Focusing an element must not trigger a context change (navigation, form submission, dialog launch).

```typescript
// ❌ Focus triggers navigation
<select onFocus={() => router.push('/page')} />

// ❌ Focus submits a form
<input onFocus={() => form.submit()} />

// ✅ Change only on explicit user action (click, Enter)
<select onChange={handleChange} />
```

### 3.2.2 On input (A)
Changing a form control's value must not automatically trigger a context change unless the user is warned in advance.

```html
<!-- ❌ Auto-submit on select change -->
<select onchange="this.form.submit()">...</select>

<!-- ✅ Change + explicit submit -->
<select onchange="updatePreference(this.value)">...</select>
<button type="submit">Apply</button>

<!-- OR warn users in advance -->
<p>Selecting a country will reload the page to show local pricing.</p>
<select onchange="this.form.submit()">...</select>
```

### 3.2.3 Consistent navigation (AA)
Navigation that appears on multiple pages must be in the same relative position on each page.

```
✅ Navigation, header, footer, search — same position across all pages
✅ Breadcrumbs — same position relative to page content
❌ Moving the primary navigation to different positions on different pages
```

### 3.2.4 Consistent identification (AA)
Components with the same function must be identified consistently across pages.

```html
<!-- ✅ Same icon + label for search on every page -->
<button aria-label="Search">
  <svg aria-hidden="true"><!-- search icon --></svg>
  Search
</button>

<!-- ❌ "Search" on one page, "Find" on another, "Query" on a third -->
```

### 3.2.6 Consistent help (A) ⭐ NEW IN WCAG 2.2
If help mechanisms (contact info, chatbot, FAQ link) appear on multiple pages, they must be in the same relative position on each page.

```html
<!-- ✅ Help link in the same position (e.g. footer) on every page -->
<footer>
  <nav aria-label="Support">
    <a href="/help">Help centre</a>
    <a href="/contact">Contact us</a>
  </nav>
</footer>
```

### 3.3.1 Error identification (A)
Errors must be identified in text, not colour alone, and describe the specific error.

```html
<!-- ✅ Error with description and ARIA -->
<label for="email">Email address</label>
<input id="email" type="email"
       aria-invalid="true"
       aria-describedby="email-error" />
<span id="email-error" role="alert">
  Enter a valid email address, for example name@example.com
</span>
```

### 3.3.2 Labels or instructions (A)
All form inputs must have labels. Required fields, format requirements, and constraints must be communicated before submission.

```html
<!-- ✅ Required fields flagged in label, not just visually -->
<label for="phone">
  Phone number
  <span aria-hidden="true"> *</span>
  <span class="sr-only">(required)</span>
</label>
<input id="phone" type="tel" required
       aria-describedby="phone-hint"
       autocomplete="tel" />
<span id="phone-hint">Format: 07700 900000</span>

<!-- ✅ Or use aria-required -->
<input aria-required="true" />
```

### 3.3.3 Error suggestion (AA)
When an input error is detected and suggestions for correction are known, the suggestion must be provided.

```html
<!-- ✅ Not just "invalid date" — tell them the format -->
<span role="alert" id="dob-error">
  Enter your date of birth in DD/MM/YYYY format, for example 15/03/1990
</span>

<!-- ✅ Not just "password invalid" — tell them the rules -->
<span role="alert" id="pw-error">
  Password must be at least 8 characters and include one number
</span>
```

### 3.3.4 Error prevention — legal, financial, data (AA)
For pages that cause legal commitments, financial transactions, or data submission: provide at least one of:
- **Reversible** — submission can be undone
- **Checked** — data is checked for errors with opportunity to correct
- **Confirmed** — review/confirmation step before final submission

```typescript
// ✅ Confirmation step before purchase
function CheckoutFlow() {
  const [step, setStep] = useState<'review' | 'confirm' | 'complete'>('review');
  // review → confirm → complete (not directly to complete)
}

// ✅ Or allow cancellation within a period
// ✅ Or show validation errors before final submission
```

### 3.3.7 Redundant entry (A) ⭐ NEW IN WCAG 2.2
Information previously entered in the same process must be auto-populated or selectable — users must not re-enter it.

```typescript
// ✅ If billing = shipping, copy the values
function CheckoutForm() {
  const [sameAddress, setSameAddress] = useState(false);

  return (
    <>
      <ShippingAddressFields onChange={setShipping} />
      <label>
        <input type="checkbox"
               checked={sameAddress}
               onChange={e => {
                 setSameAddress(e.target.checked);
                 if (e.target.checked) setBilling(shipping); // auto-populate
               }} />
        Billing address is the same as shipping
      </label>
      {!sameAddress && <BillingAddressFields />}
    </>
  );
}
```

### 3.3.8 Accessible authentication minimum (AA) ⭐ NEW IN WCAG 2.2
Authentication must not require a cognitive function test (solving puzzles, memorising patterns, transcribing distorted text) unless an alternative is provided.

```html
<!-- ❌ CAPTCHA with no alternative — fails -->
<img src="captcha.png" alt="Type these distorted characters" />

<!-- ✅ Options that pass: -->
<!-- 1. Allow password manager (don't block paste, don't use custom password inputs) -->
<input type="password" autocomplete="current-password" />

<!-- 2. Email magic link / passkey / biometric — no cognitive test -->
<button>Sign in with passkey</button>

<!-- 3. CAPTCHA with audio alternative -->
<img src="captcha.png" alt="Type the characters shown" />
<a href="#audio-captcha">Audio alternative</a>

<!-- 4. Object recognition CAPTCHA (click traffic lights) is allowed -->
```

---

## Principle 4 — Robust

### 4.1.2 Name, role, value (A)
All custom components must have accessible names, roles, states, and properties.

```html
<!-- ✅ Toggle button -->
<button aria-pressed="false" onclick="toggle(this)">
  Dark mode
</button>

<!-- ✅ Expandable section -->
<button aria-expanded="false" aria-controls="faq-1">
  What is WCAG?
</button>
<div id="faq-1" hidden>...</div>

<!-- ✅ Tab panel -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">Overview</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2">Details</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>...</div>
```

### 4.1.3 Status messages (AA)
Status messages (success, error, loading, results count) must be communicated to assistive technology without receiving focus.

```html
<!-- ✅ Success message — polite announcement -->
<div role="status" aria-live="polite" aria-atomic="true">
  Your changes have been saved
</div>

<!-- ✅ Error — assertive (interrupts immediately) -->
<div role="alert" aria-live="assertive" aria-atomic="true">
  Error: Could not save. Please try again.
</div>

<!-- ✅ Loading state -->
<div role="status" aria-live="polite">
  <span aria-hidden="true"><!-- spinner icon --></span>
  <span class="sr-only">Loading results...</span>
</div>

<!-- ✅ Search results count -->
<div role="status" aria-live="polite" aria-atomic="true">
  12 results found for "accessible forms"
</div>

<!-- ❌ Alert that takes focus — must not steal focus from user's current position -->
<!-- Only use focus management for modal dialogs, not status messages -->
```

---

## Animation and Motion

```css
/* ✅ All animations and transitions must respect user preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ✅ Decorative animations only — wrap in no-preference check */
@media (prefers-reduced-motion: no-preference) {
  .hero { animation: fadeIn 0.5s ease; }
}
```

---

## Screen Reader Only Utility Class

```css
/* ✅ Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## WCAG 2.2 AA Checklist

### Perceivable
- [ ] 1.1.1 All images have alt text (empty for decorative)
- [ ] 1.2.1 Audio/video-only has transcript or text alternative
- [ ] 1.2.2 Prerecorded video has closed captions
- [ ] 1.2.3 Prerecorded video has audio description or transcript
- [ ] 1.2.4 Live video has live captions (AA)
- [ ] 1.2.5 Prerecorded video has audio description track (AA)
- [ ] 1.3.1 Structure conveyed through semantic HTML
- [ ] 1.3.2 DOM reading order matches visual order
- [ ] 1.3.3 Instructions don't rely on shape/colour/position alone
- [ ] 1.3.4 Not locked to portrait or landscape (AA)
- [ ] 1.3.5 Personal input fields have autocomplete attributes (AA)
- [ ] 1.4.1 Colour not the only means of conveying information
- [ ] 1.4.2 Auto-playing audio has stop/pause/mute control
- [ ] 1.4.3 Text contrast minimum 4.5:1 (3:1 for large text) (AA)
- [ ] 1.4.4 Text resizable to 200% without loss (AA)
- [ ] 1.4.5 Real text used instead of images of text (AA)
- [ ] 1.4.10 Content reflows at 320px, no horizontal scroll (AA)
- [ ] 1.4.11 UI component contrast minimum 3:1 (AA)
- [ ] 1.4.12 Content survives custom text spacing (AA)
- [ ] 1.4.13 Hover/focus-triggered content is dismissible and hoverable (AA)

### Operable
- [ ] 2.1.1 All functionality available by keyboard
- [ ] 2.1.2 No keyboard traps (modals excepted with Escape)
- [ ] 2.1.4 Single-key shortcuts are remappable or toggleable
- [ ] 2.2.1 Time limits adjustable or extendable
- [ ] 2.2.2 Moving content has pause/stop/hide control
- [ ] 2.3.1 Content flashes ≤3 times/second
- [ ] 2.4.1 Skip navigation link present
- [ ] 2.4.2 Every page has unique, descriptive title
- [ ] 2.4.3 Focus order is logical (matches reading order)
- [ ] 2.4.4 Link text describes destination in context
- [ ] 2.4.5 Multiple ways to find pages (search, sitemap, nav) (AA)
- [ ] 2.4.6 Headings and labels are descriptive (AA)
- [ ] 2.4.7 Focus indicator visible (never suppressed) (AA)
- [ ] 2.4.11 Focused element not entirely hidden by sticky elements (AA) ⭐2.2
- [ ] 2.5.1 Multi-point gestures have single-pointer alternative
- [ ] 2.5.2 Actions fire on pointer-up event, not pointer-down
- [ ] 2.5.3 Accessible name includes visible label text
- [ ] 2.5.4 Motion-triggered functions have UI alternative
- [ ] 2.5.7 Drag-and-drop has single-pointer alternative (AA) ⭐2.2
- [ ] 2.5.8 Targets minimum 24×24px or adequate spacing (AA) ⭐2.2

### Understandable
- [ ] 3.1.1 html element has lang attribute
- [ ] 3.1.2 Foreign language passages have lang attribute (AA)
- [ ] 3.2.1 Focus does not trigger context change
- [ ] 3.2.2 Input change does not trigger context change
- [ ] 3.2.3 Navigation in consistent position across pages (AA)
- [ ] 3.2.4 Components with same function identified consistently (AA)
- [ ] 3.2.6 Help mechanisms in consistent position across pages ⭐2.2
- [ ] 3.3.1 Errors identified in text, describing what is wrong
- [ ] 3.3.2 Labels and instructions before user input
- [ ] 3.3.3 Error suggestions provided when format is known (AA)
- [ ] 3.3.4 Legal/financial submissions are reversible or confirmable (AA)
- [ ] 3.3.7 Previously entered info auto-populated in same process ⭐2.2
- [ ] 3.3.8 Authentication doesn't require cognitive function test (AA) ⭐2.2

### Robust
- [ ] 4.1.2 All custom components have name, role, state via ARIA
- [ ] 4.1.3 Status messages communicated without focus change (AA)

**⭐2.2 = new criterion in WCAG 2.2 (October 2023)**
