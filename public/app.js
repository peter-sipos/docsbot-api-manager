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
const endpointPickerBtn = document.getElementById("endpointPickerBtn");
const endpointDropdown = document.getElementById("endpointDropdown");

const finalUrlLabel = document.getElementById("finalUrlLabel");
const curlPreviewEl = document.getElementById("curlPreview");
const requestBodyPreviewEl = document.getElementById("requestBodyPreview");
const statusLabel = document.getElementById("statusLabel");
const timeLabel = document.getElementById("timeLabel");
const responseHeadersEl = document.getElementById("responseHeaders");
const responseBodyEl = document.getElementById("responseBody");

const THEME_STORAGE_KEY = "docsbot-api-utility-theme";
const USER_CONFIG_STORAGE_KEY = "docsbot-api-utility-user-config";
const STARRED_STORAGE_KEY = "docsbot-api-utility-starred";

const DOCSBOT_ENDPOINTS = [
  {
    group: "Chat",
    endpoints: [
      { method: "POST", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/chat", label: "Chat" },
      { method: "POST", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/chat-agent", label: "Chat Agent" },
      { method: "POST", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/search", label: "Semantic Search" }
    ]
  },
  {
    group: "Answer Rating",
    endpoints: [
      { method: "PUT", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/rate/:answerId", label: "Rate Answer" },
      { method: "PUT", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/support/:answerId", label: "Support Escalation" }
    ]
  },
  {
    group: "Conversation Actions",
    endpoints: [
      { method: "GET", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/conversations/:conversationId/summarize", label: "Summarize Conversation" },
      { method: "GET", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/conversations/:conversationId/ticket", label: "Get Conversation Ticket" },
      { method: "POST", path: "https://api.docsbot.ai/teams/:teamId/bots/:botId/conversations/:conversationId/lead", label: "Capture Lead" }
    ]
  },
  {
    group: "Teams",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams", label: "List Teams" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId", label: "Get Team" },
      { method: "PUT", path: "https://docsbot.ai/api/teams/:teamId", label: "Update Team" }
    ]
  },
  {
    group: "Team Members",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/members", label: "List Members" },
      { method: "PUT", path: "https://docsbot.ai/api/teams/:teamId/members", label: "Update Member Role" },
      { method: "DELETE", path: "https://docsbot.ai/api/teams/:teamId/members", label: "Remove Member" },
      { method: "POST", path: "https://docsbot.ai/api/teams/:teamId/invite", label: "Invite Member" },
      { method: "PUT", path: "https://docsbot.ai/api/teams/:teamId/invite", label: "Respond to Invite" }
    ]
  },
  {
    group: "Bots",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots", label: "List Bots" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId", label: "Get Bot" },
      { method: "POST", path: "https://docsbot.ai/api/teams/:teamId/bots", label: "Create Bot" },
      { method: "PUT", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId", label: "Update Bot" },
      { method: "DELETE", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId", label: "Delete Bot" }
    ]
  },
  {
    group: "Sources",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/sources", label: "List Sources" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/sources/:sourceId", label: "Get Source" },
      { method: "POST", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/sources", label: "Create Source" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/upload-url", label: "Get Upload URL" },
      { method: "PUT", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/sources/:sourceId", label: "Retry Source" },
      { method: "DELETE", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/sources/:sourceId", label: "Delete Source" }
    ]
  },
  {
    group: "Questions",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/questions", label: "List Questions" },
      { method: "DELETE", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/questions/:questionId", label: "Delete Question" }
    ]
  },
  {
    group: "Conversations",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/conversations", label: "List Conversations" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/conversations/:conversationId", label: "Get Conversation" },
      { method: "DELETE", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/conversations/:conversationId", label: "Delete Conversation" }
    ]
  },
  {
    group: "Leads",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/leads", label: "List Leads" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/leads/export", label: "Export Leads CSV" },
      { method: "DELETE", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/leads/:leadId", label: "Delete Lead" }
    ]
  },
  {
    group: "Webhooks",
    endpoints: [
      { method: "POST", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/webhooks", label: "Create Webhook" },
      { method: "DELETE", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/webhooks/:webhookId", label: "Delete Webhook" }
    ]
  },
  {
    group: "Research",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/research", label: "List Research Jobs" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/research/:jobId", label: "Get Research Job" }
    ]
  },
  {
    group: "Stats & Reports",
    endpoints: [
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/stats", label: "Get Bot Statistics" },
      { method: "GET", path: "https://docsbot.ai/api/teams/:teamId/bots/:botId/reports", label: "Get Bot Reports" }
    ]
  }
];

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

// ---- Endpoint Picker ----

function readStarred() {
  try {
    const raw = localStorage.getItem(STARRED_STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (_error) {
    return new Set();
  }
}

function writeStarred(set) {
  localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify([...set]));
}

function toggleStar(key) {
  const starred = readStarred();
  if (starred.has(key)) {
    starred.delete(key);
  } else {
    starred.add(key);
  }
  writeStarred(starred);
}

function endpointMatchesFilter(ep, filter) {
  return (
    ep.label.toLowerCase().includes(filter) ||
    ep.method.toLowerCase().includes(filter) ||
    ep.path.toLowerCase().includes(filter)
  );
}

function renderEndpointItem(ep, isStarred) {
  const key = escapeHtml(`${ep.method}|${ep.path}`);
  const methodClass = `method-${ep.method.toLowerCase()}`;
  return `<div class="ep-item" data-key="${key}" data-method="${escapeHtml(ep.method)}" data-path="${escapeHtml(ep.path)}">
      <button type="button" class="ep-star ${isStarred ? "starred" : ""}">${isStarred ? "\u2605" : "\u2606"}</button>
      <span class="ep-method ${methodClass}">${escapeHtml(ep.method)}</span>
      <span class="ep-label">${escapeHtml(ep.label)}</span>
    </div>`;
}

function renderEndpointList(filter) {
  const listEl = endpointDropdown.querySelector(".ep-list");
  if (!listEl) return;
  const starred = readStarred();
  const lowerFilter = filter.toLowerCase().trim();

  let html = "";

  if (starred.size > 0) {
    const starredItems = [];
    for (const group of DOCSBOT_ENDPOINTS) {
      for (const ep of group.endpoints) {
        if (starred.has(`${ep.method}|${ep.path}`)) {
          starredItems.push(ep);
        }
      }
    }
    const filtered = lowerFilter
      ? starredItems.filter((ep) => endpointMatchesFilter(ep, lowerFilter))
      : starredItems;
    if (filtered.length > 0) {
      html += `<div class="ep-group"><div class="ep-group-header starred-header">\u2605 Starred</div>`;
      for (const ep of filtered) {
        html += renderEndpointItem(ep, true);
      }
      html += `</div>`;
    }
  }

  for (const group of DOCSBOT_ENDPOINTS) {
    const filtered = lowerFilter
      ? group.endpoints.filter((ep) => endpointMatchesFilter(ep, lowerFilter))
      : group.endpoints;
    if (filtered.length === 0) continue;
    html += `<div class="ep-group"><div class="ep-group-header">${escapeHtml(group.group)}</div>`;
    for (const ep of filtered) {
      html += renderEndpointItem(ep, starred.has(`${ep.method}|${ep.path}`));
    }
    html += `</div>`;
  }

  if (!html) {
    html = `<div class="ep-no-results">No endpoints match your search.</div>`;
  }
  listEl.innerHTML = html;
}

function openEndpointDropdown() {
  endpointDropdown.innerHTML = `<input type="text" class="ep-search" placeholder="Search endpoints..." /><div class="ep-list"></div>`;
  endpointDropdown.classList.remove("hidden");
  endpointPickerBtn.classList.add("active");

  const searchInput = endpointDropdown.querySelector(".ep-search");
  searchInput.focus();
  searchInput.addEventListener("input", () => {
    renderEndpointList(searchInput.value);
  });

  renderEndpointList("");
}

function closeEndpointDropdown() {
  endpointDropdown.classList.add("hidden");
  endpointPickerBtn.classList.remove("active");
}

function selectEndpoint(method, path) {
  methodEl.value = method;
  urlTemplateEl.value = path;
  renderPathParams();
}

endpointPickerBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (endpointDropdown.classList.contains("hidden")) {
    openEndpointDropdown();
  } else {
    closeEndpointDropdown();
  }
});

endpointDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
  const starBtn = e.target.closest(".ep-star");
  if (starBtn) {
    const item = starBtn.closest(".ep-item");
    if (item) {
      toggleStar(item.dataset.key);
      const searchInput = endpointDropdown.querySelector(".ep-search");
      renderEndpointList(searchInput ? searchInput.value : "");
    }
    return;
  }
  const item = e.target.closest(".ep-item");
  if (item) {
    selectEndpoint(item.dataset.method, item.dataset.path);
    closeEndpointDropdown();
  }
});

document.addEventListener("click", (e) => {
  if (
    !endpointDropdown.classList.contains("hidden") &&
    !endpointDropdown.contains(e.target) &&
    !endpointPickerBtn.contains(e.target)
  ) {
    closeEndpointDropdown();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !endpointDropdown.classList.contains("hidden")) {
    closeEndpointDropdown();
  }
});

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
