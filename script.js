"use strict";

// A basic immediate-execution calculator (like a phone calculator):
// 2 + 3 x 4 = 20, because each operator applies to the running result.

const MAX_DIGITS = 16;
const SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const DIV_ZERO = "Cannot divide by zero";

const state = {
  current: "0", // the number being typed / shown
  previous: null, // left operand (number) waiting for an operator
  operator: null, // pending operator
  overwrite: false, // next digit starts a new number
  entered: false, // a right-hand operand has been entered since the last operator
  lastOperation: null, // { operator, operand } for repeated "="
  error: null,
  expression: "",
};

const history = [];

const valueEl = document.getElementById("value");
const expressionEl = document.getElementById("expression");
const clearKey = document.getElementById("clear-key");
const historyList = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");

// Round away floating point noise such as 0.1 + 0.2 = 0.30000000000000004.
function tidy(n) {
  return Number.parseFloat(n.toPrecision(12));
}

function compute(a, operator, b) {
  switch (operator) {
    case "+":
      return tidy(a + b);
    case "-":
      return tidy(a - b);
    case "*":
      return tidy(a * b);
    case "/":
      if (b === 0) throw new Error(DIV_ZERO);
      return tidy(a / b);
    default:
      return b;
  }
}

function formatNumber(value) {
  if (typeof value === "string") {
    // Keep what the user is typing (e.g. "0." or "2.50"), just add thousands separators.
    const negative = value.startsWith("-");
    const [int, frac] = value.replace("-", "").split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return (negative ? "-" : "") + grouped + (frac !== undefined ? "." + frac : "");
  }
  if (!Number.isFinite(value)) return "Error";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 1e16 || abs < 1e-9)) {
    return value.toExponential(8).replace(/\.?0+e/, "e");
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 10 });
}

function currentNumber() {
  return Number.parseFloat(state.current);
}

function setError(message) {
  state.error = message;
  state.previous = null;
  state.operator = null;
  state.lastOperation = null;
  state.overwrite = true;
}

function resetIfError() {
  if (state.error) {
    state.error = null;
    state.current = "0";
    state.expression = "";
  }
}

function inputDigit(digit) {
  resetIfError();
  state.entered = true;
  if (state.overwrite) {
    state.current = digit;
    state.overwrite = false;
    if (!state.operator) state.expression = "";
    return;
  }
  if (state.current.replace(/[-.]/g, "").length >= MAX_DIGITS) return;
  state.current = state.current === "0" ? digit : state.current === "-0" ? "-" + digit : state.current + digit;
}

function inputDecimal() {
  resetIfError();
  state.entered = true;
  if (state.overwrite) {
    state.current = "0.";
    state.overwrite = false;
    if (!state.operator) state.expression = "";
    return;
  }
  if (!state.current.includes(".")) state.current += ".";
}

function chooseOperator(operator) {
  resetIfError();
  const value = currentNumber();

  if (state.operator && state.entered) {
    // Chained operation: evaluate the pending one first (e.g. 2 + 3 then x).
    try {
      const result = compute(state.previous, state.operator, value);
      state.previous = result;
      state.current = String(result);
    } catch (err) {
      setError(err.message);
      return;
    }
  } else if (!state.operator || state.previous === null) {
    state.previous = value;
  }
  // If an operator was just pressed, pressing another one replaces it.
  state.operator = operator;
  state.overwrite = true;
  state.entered = false;
  state.lastOperation = null;
  state.expression = `${formatNumber(state.previous)} ${SYMBOLS[operator]}`;
}

function equals() {
  if (state.error) return;
  let a;
  let operator;
  let b;

  if (state.operator) {
    a = state.previous;
    operator = state.operator;
    b = state.entered ? currentNumber() : state.previous; // "5 + =" means 5 + 5
  } else if (state.lastOperation) {
    // Pressing "=" again repeats the last operation: 2 + 3 = = gives 8.
    a = currentNumber();
    ({ operator, operand: b } = state.lastOperation);
  } else {
    return;
  }

  const expression = `${formatNumber(a)} ${SYMBOLS[operator]} ${formatNumber(b)} =`;
  try {
    const result = compute(a, operator, b);
    state.current = String(result);
    state.expression = expression;
    state.lastOperation = { operator, operand: b };
    addHistory(expression, result);
  } catch (err) {
    state.expression = expression;
    setError(err.message);
    return;
  }
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
  state.entered = false;
}

function clear() {
  // First press clears the current entry, second press clears everything.
  if (!state.error && state.current !== "0" && !state.overwrite) {
    state.current = "0";
    return;
  }
  Object.assign(state, {
    current: "0",
    previous: null,
    operator: null,
    overwrite: false,
    entered: false,
    lastOperation: null,
    error: null,
    expression: "",
  });
}

function backspace() {
  if (state.error) {
    resetIfError();
    return;
  }
  if (state.overwrite) return; // don't edit a result
  const next = state.current.slice(0, -1);
  state.current = next === "" || next === "-" ? "0" : next;
}

function negate() {
  resetIfError();
  if (state.operator && !state.entered) {
    // "5 x +/-" starts typing a negative right-hand operand.
    state.current = "-0";
    state.overwrite = false;
    state.entered = true;
    return;
  }
  if (currentNumber() === 0 && !state.current.startsWith("-")) return;
  state.current = state.current.startsWith("-") ? state.current.slice(1) : "-" + state.current;
}

function percent() {
  resetIfError();
  const value = currentNumber();
  // With a pending + or -, "%" means a percentage of the left operand (100 + 10% = 110).
  const result =
    state.operator && (state.operator === "+" || state.operator === "-")
      ? tidy((state.previous * value) / 100)
      : tidy(value / 100);
  state.current = String(result);
  state.overwrite = true;
  state.entered = true;
}

function addHistory(expression, result) {
  history.unshift({ expression, result });
  history.length = Math.min(history.length, 8);
  renderHistory();
}

function renderHistory() {
  historyList.replaceChildren(
    ...history.map(({ expression, result }) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "history-item";
      button.title = "Use this result";
      button.innerHTML = `<span class="history-expression"></span><span class="history-result"></span>`;
      button.querySelector(".history-expression").textContent = expression;
      button.querySelector(".history-result").textContent = formatNumber(result);
      button.addEventListener("click", () => {
        resetIfError();
        state.current = String(result);
        state.overwrite = true;
        state.entered = true;
        if (!state.operator) state.expression = "";
        render();
      });
      li.append(button);
      return li;
    })
  );
  historyEmpty.hidden = history.length > 0;
}

function render() {
  const text = state.error ?? formatNumber(state.overwrite ? currentNumber() : state.current);
  valueEl.textContent = text;
  valueEl.classList.toggle("is-error", Boolean(state.error));
  // Shrink long numbers so they always fit.
  valueEl.style.fontSize = text.length > 14 ? "1.6rem" : text.length > 10 ? "2.2rem" : "";
  expressionEl.textContent = state.expression;
  clearKey.textContent = !state.error && state.current !== "0" && !state.overwrite ? "C" : "AC";
  clearKey.setAttribute("aria-label", clearKey.textContent === "C" ? "Clear entry" : "All clear");

  document.querySelectorAll(".key-op").forEach((key) => {
    key.classList.toggle("is-active", state.operator === key.dataset.operator && !state.entered);
  });
}

function press(key) {
  if (key.dataset.digit !== undefined) inputDigit(key.dataset.digit);
  else if (key.dataset.operator) chooseOperator(key.dataset.operator);
  else {
    const actions = { clear, backspace, percent, negate, decimal: inputDecimal, equals };
    actions[key.dataset.action]?.();
  }
  render();
}

document.querySelector(".keys").addEventListener("click", (event) => {
  const key = event.target.closest(".key");
  if (key) press(key);
});

const KEYBOARD = {
  Enter: '[data-action="equals"]',
  "=": '[data-action="equals"]',
  Backspace: '[data-action="backspace"]',
  Escape: '[data-action="clear"]',
  Delete: '[data-action="clear"]',
  "%": '[data-action="percent"]',
  F9: '[data-action="negate"]',
  ".": '[data-action="decimal"]',
  ",": '[data-action="decimal"]',
  "+": '[data-operator="+"]',
  "-": '[data-operator="-"]',
  "*": '[data-operator="*"]',
  x: '[data-operator="*"]',
  "/": '[data-operator="/"]',
};

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const selector = /^[0-9]$/.test(event.key) ? `[data-digit="${event.key}"]` : KEYBOARD[event.key];
  if (!selector) return;
  event.preventDefault(); // stop "/" opening quick find, Enter re-clicking a focused button, etc.
  const key = document.querySelector(selector);
  press(key);
  key.classList.add("is-pressed");
  setTimeout(() => key.classList.remove("is-pressed"), 120);
});

document.getElementById("clear-history").addEventListener("click", () => {
  history.length = 0;
  renderHistory();
});

renderHistory();
render();
