# SimpleCalculator

A clean, keyboard-friendly calculator built with plain HTML, CSS and vanilla JavaScript. No frameworks, no build step.

**Live demo:** https://akshaytripathiai.github.io/SimpleCalcultor/

Built as an early practice project while learning JavaScript, and later reworked into a full calculator.

## Features

- On-screen keypad for digits, `+ - × ÷`, decimal point, `±` (change sign) and `%`
- Chained operations that apply to the running result, phone-calculator style (`2 + 3 × 4 = 20`)
- Press `=` again to repeat the last operation (`2 + 3 = =` gives `8`); pressing another operator replaces the pending one
- `C` clears the current entry, `AC` clears everything; backspace deletes the last digit
- Division by zero shows "Cannot divide by zero" instead of `Infinity`; the next key press starts fresh
- Floating-point noise is rounded away (`0.1 + 0.2 = 0.3`), with thousands separators and scientific notation for very large or small results
- The display shows the expression being built, and the pending operator key is highlighted
- History of the last 8 calculations; click one to reuse its result
- Full keyboard support: digits, `+ - * /` (or `x`), `Enter`/`=`, `Backspace`, `Esc`/`Delete`, `%`, `.`/`,`, `F9` for ±
- Responsive layout and automatic light/dark theme

## Tech stack

- HTML, CSS (custom properties, grid), vanilla JavaScript

## Getting started

No build step or dependencies.

```bash
git clone https://github.com/AkshayTripathiAI/SimpleCalcultor.git
cd SimpleCalcultor
```

Open `index.html` in a browser.

## Project structure

```
index.html   # Markup: display, keypad, history
script.js    # Calculator state, keypad and keyboard handling, history
style.css    # Layout and light/dark theme
```
