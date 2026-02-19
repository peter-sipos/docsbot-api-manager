const methodEl = document.getElementById("method");
const urlTemplateEl = document.getElementById("urlTemplate");
const bearerTokenEl = document.getElementById("bearerToken");
const pathParamsContainer = document.getElementById("pathParamsContainer");
const queryParamsContainer = document.getElementById("queryParamsContainer");
const addQueryParamBtn = document.getElementById("addQueryParamBtn");
const requestBodyEl = document.getElementById("requestBody");
const sendBtn = document.getElementById("sendBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const defaultTeamIdEl = document.getElementById("defaultTeamId");
const defaultBotIdEl = document.getElementById("defaultBotId");

const finalUrlLabel = document.getElementById("finalUrlLabel");
const curlPreviewEl = document.getElementById("curlPreview");
const requestBodyPreviewEl = document.getElementById("requestBodyPreview");
const statusLabel = document.getElementById("statusLabel");
const timeLabel = document.getElementById("timeLabel");
const responseHeadersEl = document.getElementById("responseHeaders");
const responseBodyEl = document.getElementById("responseBody");

const THEME_STORAGE_KEY = "docsbot-api-utility-theme";
const USER_CONFIG_STORAGE_KEY = "docsbot-api-utility-user-config";

function readStoredUserConfig() {
  try {
    const raw = localStorage.getItem(USER_CONFIG_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function applyStoredUserConfig() {
  const stored = readStoredUserConfig();
  bearerTokenEl.value = stored?.bearerToken ? String(stored.bearerToken) : "";
  defaultTeamIdEl.value = stored?.teamId ? String(stored.teamId) : "";
  defaultBotIdEl.value = stored?.botId ? String(stored.botId) : "";
}

function persistUserConfig() {
  const data = {
    bearerToken: bearerTokenEl.value,
    teamId: defaultTeamIdEl.value,
    botId: defaultBotIdEl.value
  };
  localStorage.setItem(USER_CONFIG_STORAGE_KEY, JSON.stringify(data));
}

function getDefaultPathParamValue(name) {
  if (name === "teamId") {
    return defaultTeamIdEl.value || "";
  }
  if (name === "botId") {
    return defaultBotIdEl.value || "";
  }
  return "";
}

function parsePathParamNames(template) {
  const matches = template.match(/:([A-Za-z_][A-Za-z0-9_]*)/g) || [];
  return [...new Set(matches.map((x) => x.slice(1)))];
}

function createQueryRow(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "param-row";
  row.innerHTML = `
    <input type="text" placeholder="key" data-role="key" value="${escapeHtml(key)}" />
    <input type="text" placeholder="value" data-role="value" value="${escapeHtml(value)}" />
    <button type="button" data-role="remove">Remove</button>
  `;
  row.querySelector('[data-role="remove"]').addEventListener("click", () => {
    row.remove();
  });
  return row;
}

function renderPathParams() {
  const names = parsePathParamNames(urlTemplateEl.value.trim());
  const existingValues = {};
  const existingInputs = pathParamsContainer.querySelectorAll("input[data-param-name]");
  for (const input of existingInputs) {
    existingValues[input.dataset.paramName] = input.value;
  }

  pathParamsContainer.innerHTML = "";
  if (names.length === 0) {
    const empty = document.createElement("small");
    empty.textContent = "No :pathParams detected in URL template.";
    pathParamsContainer.appendChild(empty);
    return;
  }

  for (const name of names) {
    const row = document.createElement("div");
    row.className = "path-row";
    const safeName = escapeHtml(name);
    row.innerHTML = `
      <code>:${safeName}</code>
      <input type="text" data-param-name="${safeName}" placeholder="Value for ${safeName}" />
    `;
    const input = row.querySelector("input");
    input.value = existingValues[name] || getDefaultPathParamValue(name);
    pathParamsContainer.appendChild(row);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function collectPathParams() {
  const out = {};
  const inputs = pathParamsContainer.querySelectorAll("input[data-param-name]");
  for (const input of inputs) {
    const name = input.dataset.paramName;
    const explicitValue = input.value;
    if (explicitValue.trim() !== "") {
      out[name] = explicitValue;
      continue;
    }
    const fallback = getDefaultPathParamValue(name);
    out[name] = fallback;
  }
  return out;
}

function collectQueryParams() {
  const out = [];
  const rows = queryParamsContainer.querySelectorAll(".param-row");
  for (const row of rows) {
    const key = row.querySelector('[data-role="key"]').value;
    const value = row.querySelector('[data-role="value"]').value;
    out.push({ key, value });
  }
  return out;
}

function prettyPrintJsonIfPossible(text) {
  try {
    const parsed = JSON.parse(text);
    return JSON.stringify(parsed, null, 2);
  } catch (_error) {
    return text || "-";
  }
}

function setResponseStatus(statusCode) {
  if (!statusCode) {
    statusLabel.innerHTML = "Status: -";
    return;
  }
  const cls = statusCode >= 200 && statusCode < 400 ? "status-ok" : "status-bad";
  statusLabel.innerHTML = `Status: <span class="${cls}">${statusCode}</span>`;
}

function setTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalizedTheme);
  localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  themeToggleBtn.textContent = normalizedTheme === "dark" ? "Light Theme" : "Dark Theme";
}

function initTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme) {
    setTheme(savedTheme);
    return;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

async function sendRequest() {
  persistUserConfig();
  const payload = {
    method: methodEl.value || "GET",
    urlTemplate: urlTemplateEl.value.trim(),
    bearerToken: bearerTokenEl.value,
    pathParams: collectPathParams(),
    queryParams: collectQueryParams(),
    requestBody: requestBodyEl.value
  };

  if (!payload.urlTemplate) {
    alert("URL Template is required.");
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";
  setResponseStatus(null);
  timeLabel.textContent = "Time: -";
  responseHeadersEl.textContent = "Loading...";
  responseBodyEl.textContent = "Loading...";

  try {
    const res = await fetch("/api/call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.request) {
      finalUrlLabel.textContent = `Final URL: ${data.request.finalUrl || "-"}`;
      curlPreviewEl.textContent = data.request.curlCommand || "-";
      requestBodyPreviewEl.textContent = data.request.body || "-";
    } else {
      finalUrlLabel.textContent = "Final URL: -";
      curlPreviewEl.textContent = "-";
      requestBodyPreviewEl.textContent = payload.requestBody || "-";
    }

    if (data.response) {
      setResponseStatus(data.response.statusCode);
      if (data.response.elapsedTimeSeconds !== null && data.response.elapsedTimeSeconds !== undefined) {
        timeLabel.textContent = `Time: ${data.response.elapsedTimeSeconds}s`;
      }
      responseHeadersEl.textContent = prettyPrintJsonIfPossible(
        JSON.stringify(data.response.headers || {}, null, 2)
      );
      responseBodyEl.textContent = prettyPrintJsonIfPossible(data.response.body || "");
    } else {
      setResponseStatus(null);
      const errHeaders = data.stderr ? { stderr: data.stderr } : {};
      responseHeadersEl.textContent = JSON.stringify(errHeaders, null, 2) || "-";
      responseBodyEl.textContent = prettyPrintJsonIfPossible(
        data.error || "Request failed before receiving a response."
      );
    }
  } catch (error) {
    finalUrlLabel.textContent = "Final URL: -";
    curlPreviewEl.textContent = "-";
    requestBodyPreviewEl.textContent = payload.requestBody || "-";
    setResponseStatus(null);
    timeLabel.textContent = "Time: -";
    responseHeadersEl.textContent = "-";
    responseBodyEl.textContent = `Unexpected error: ${error.message}`;
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send Request";
  }
}

function applyEnvHints() {
  const hints = window.__ENV_HINTS__;
  if (!hints) {
    return;
  }

  const fields = [
    { flag: hints.hasBearerToken, inputEl: bearerTokenEl, labelFor: "bearerToken" },
    { flag: hints.hasTeamId, inputEl: defaultTeamIdEl, labelFor: "defaultTeamId" },
    { flag: hints.hasBotId, inputEl: defaultBotIdEl, labelFor: "defaultBotId" }
  ];

  let anySet = false;
  for (const { flag, inputEl, labelFor } of fields) {
    if (!flag) {
      continue;
    }
    anySet = true;

    const labelEl = document.querySelector(`label[for="${labelFor}"]`);
    if (labelEl) {
      const badge = document.createElement("span");
      badge.className = "env-badge";
      badge.textContent = ".env";
      badge.title = "A fallback value is set in the server .env file";
      labelEl.appendChild(badge);
    }

    if (!inputEl.value) {
      inputEl.placeholder = "Using value from .env file";
    }
  }

  if (anySet) {
    const hintEl = document.getElementById("configHint");
    if (hintEl) {
      hintEl.textContent =
        "Values are stored in your browser. Empty fields fall back to the server .env file.";
    }
  }
}

addQueryParamBtn.addEventListener("click", () => {
  queryParamsContainer.appendChild(createQueryRow());
});

urlTemplateEl.addEventListener("input", () => {
  renderPathParams();
});

sendBtn.addEventListener("click", sendRequest);
themeToggleBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  setTheme(current === "dark" ? "light" : "dark");
});

bearerTokenEl.addEventListener("input", persistUserConfig);
defaultTeamIdEl.addEventListener("input", () => {
  persistUserConfig();
  renderPathParams();
});
defaultBotIdEl.addEventListener("input", () => {
  persistUserConfig();
  renderPathParams();
});

queryParamsContainer.appendChild(createQueryRow());
applyStoredUserConfig();
applyEnvHints();
renderPathParams();
initTheme();
