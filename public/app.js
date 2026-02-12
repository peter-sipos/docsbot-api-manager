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
const configHintEl = document.getElementById("configHint");

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

function persistUserConfig() {
  const data = {
    bearerToken: bearerTokenEl.value,
    teamId: defaultTeamIdEl.value,
    botId: defaultBotIdEl.value
  };
  localStorage.setItem(USER_CONFIG_STORAGE_KEY, JSON.stringify(data));
}

function normalizeRuntimeConfig(config) {
  return {
    bearerToken: config?.bearerToken ? String(config.bearerToken) : "",
    teamId: config?.teamId ? String(config.teamId) : "",
    botId: config?.botId ? String(config.botId) : "",
    hasEnvFile: Boolean(config?.hasEnvFile)
  };
}

function mergeServerAndUserConfig(serverConfig, userConfig) {
  const merged = {
    bearerToken: serverConfig.bearerToken,
    teamId: serverConfig.teamId,
    botId: serverConfig.botId
  };
  for (const key of ["bearerToken", "teamId", "botId"]) {
    if (Object.prototype.hasOwnProperty.call(userConfig, key)) {
      merged[key] = String(userConfig[key] ?? "");
    }
  }
  return merged;
}

async function initRuntimeConfig() {
  let serverConfig = normalizeRuntimeConfig({});
  try {
    const response = await fetch("/api/config");
    if (response.ok) {
      const data = await response.json();
      serverConfig = normalizeRuntimeConfig(data?.config);
    }
  } catch (_error) {
    serverConfig = normalizeRuntimeConfig({});
  }

  const storedUserConfig = readStoredUserConfig();
  const merged = mergeServerAndUserConfig(serverConfig, storedUserConfig);
  bearerTokenEl.value = merged.bearerToken;
  defaultTeamIdEl.value = merged.teamId;
  defaultBotIdEl.value = merged.botId;
  configHintEl.textContent = serverConfig.hasEnvFile
    ? "Loaded .env defaults. Frontend values override them."
    : "No .env found. Using frontend values.";
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
initTheme();
initRuntimeConfig().finally(() => {
  renderPathParams();
});
