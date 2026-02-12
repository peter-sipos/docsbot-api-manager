const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.PORT) || 3100;
const PUBLIC_DIR = path.join(__dirname, "public");
const CURL_META_MARKER = "__DOCSBOT_CURL_META__";
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const CURL_BINARY = process.platform === "win32" ? "curl.exe" : "curl";
const ENV_FILE_PATH = path.join(__dirname, ".env");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function stripWrappingQuotes(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvFileContents(rawText) {
  const parsed = {};
  const lines = String(rawText || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }
    const key = match[1];
    const rawValue = match[2];
    parsed[key] = stripWrappingQuotes(rawValue);
  }
  return parsed;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function loadEnvConfig() {
  let envValues = {};
  let hasEnvFile = false;
  try {
    const text = fs.readFileSync(ENV_FILE_PATH, "utf8");
    envValues = parseEnvFileContents(text);
    hasEnvFile = true;
  } catch (_error) {
    return {
      hasEnvFile: false,
      bearerToken: "",
      teamId: "",
      botId: ""
    };
  }

  return {
    hasEnvFile,
    bearerToken: firstNonEmpty(
      envValues.DOCSBOT_API_KEY,
      envValues.API_KEY,
      envValues.BEARER_TOKEN,
      envValues.DOCSBOT_BEARER_TOKEN
    ),
    teamId: firstNonEmpty(envValues.DOCSBOT_TEAM_ID, envValues.TEAM_ID),
    botId: firstNonEmpty(envValues.DOCSBOT_BOT_ID, envValues.BOT_ID)
  };
}

function sendJson(res, statusCode, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data)
  });
  res.end(data);
}

function extractPathParamNames(urlTemplate) {
  const matches = urlTemplate.match(/:([A-Za-z_][A-Za-z0-9_]*)/g) || [];
  return [...new Set(matches.map((token) => token.slice(1)))];
}

function buildUrl(urlTemplate, pathParams = {}, queryParams = []) {
  const expectedPathParams = extractPathParamNames(urlTemplate);
  const missingPathParams = expectedPathParams.filter((name) => {
    const value = pathParams[name];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missingPathParams.length > 0) {
    return {
      error: `Missing required path parameters: ${missingPathParams.join(", ")}`
    };
  }

  let populatedTemplate = urlTemplate;
  for (const paramName of expectedPathParams) {
    const rawValue = String(pathParams[paramName]);
    populatedTemplate = populatedTemplate.replace(
      new RegExp(`:${paramName}\\b`, "g"),
      encodeURIComponent(rawValue)
    );
  }

  let url;
  try {
    url = new URL(populatedTemplate);
  } catch (_error) {
    return { error: "Invalid URL. Please include protocol, e.g. https://..." };
  }

  for (const item of queryParams) {
    if (!item || !item.key) {
      continue;
    }
    url.searchParams.set(item.key, item.value ?? "");
  }

  return { url: url.toString() };
}

function buildCurlArgs({ method, finalUrl, bearerToken, requestBody }) {
  const upperMethod = String(method || "GET").toUpperCase();
  const args = ["-sS", "-X", upperMethod, finalUrl];

  if (bearerToken && bearerToken.trim()) {
    args.push("-H", `Authorization: Bearer ${bearerToken.trim()}`);
  }

  if (requestBody && requestBody.trim()) {
    args.push("-H", "Content-Type: application/json", "--data", requestBody);
  }

  args.push(
    "-D",
    "-",
    "-w",
    `\n${CURL_META_MARKER}%{http_code}|%{size_header}|%{time_total}`
  );

  return args;
}

function maskBearerToken(curlCommand) {
  return curlCommand.replace(
    /Authorization:\s*Bearer\s+[^\s"']+/gi,
    "Authorization: Bearer ***"
  );
}

function parseCurlResponse(stdoutBuffer) {
  const markerBuffer = Buffer.from(CURL_META_MARKER, "utf8");
  const markerIndex = stdoutBuffer.lastIndexOf(markerBuffer);

  if (markerIndex < 0) {
    return {
      parseError: "Could not parse curl output metadata.",
      rawOutput: stdoutBuffer.toString("utf8")
    };
  }

  const payloadBuffer = stdoutBuffer.slice(0, markerIndex);
  const metaRaw = stdoutBuffer
    .slice(markerIndex + markerBuffer.length)
    .toString("utf8")
    .trim();
  const [statusCodeStr, headerSizeStr, elapsedTimeStr] = metaRaw.split("|");
  const headerSize = Number(headerSizeStr);

  if (!Number.isFinite(headerSize) || headerSize < 0) {
    return {
      parseError: "Could not parse response header size.",
      rawOutput: stdoutBuffer.toString("utf8")
    };
  }

  const headerBuffer = payloadBuffer.slice(0, headerSize);
  const bodyBuffer = payloadBuffer.slice(headerSize);
  const rawHeaders = headerBuffer.toString("utf8");
  const headerBlocks = rawHeaders
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const finalHeaderBlock = headerBlocks[headerBlocks.length - 1] || "";
  const headerLines = finalHeaderBlock.split(/\r?\n/).filter(Boolean);
  const statusLine = headerLines[0] || "";
  const headers = {};

  for (const line of headerLines.slice(1)) {
    const idx = line.indexOf(":");
    if (idx <= 0) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!headers[key]) {
      headers[key] = value;
    } else if (Array.isArray(headers[key])) {
      headers[key].push(value);
    } else {
      headers[key] = [headers[key], value];
    }
  }

  return {
    statusCode: Number(statusCodeStr) || null,
    statusLine,
    headers,
    responseBody: bodyBuffer.toString("utf8"),
    elapsedTimeSeconds: Number(elapsedTimeStr) || null
  };
}

function executeCurl(curlArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(CURL_BINARY, curlArgs, { shell: false });
    const stdoutChunks = [];
    const stderrChunks = [];

    child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk) => stderrChunks.push(chunk));

    child.on("error", (error) => reject(error));
    child.on("close", (exitCode) => {
      resolve({
        exitCode,
        stdoutBuffer: Buffer.concat(stdoutChunks),
        stderrText: Buffer.concat(stderrChunks).toString("utf8").trim()
      });
    });
  });
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytes = 0;

    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(new Error("Request body too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve(text ? JSON.parse(text) : {});
      } catch (_error) {
        reject(new Error("Invalid JSON request body."));
      }
    });

    req.on("error", (error) => reject(error));
  });
}

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return false;
  }

  const rawPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(rawPath);
  const candidatePath = path.normalize(path.join(PUBLIC_DIR, decodedPath));

  if (!candidatePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { error: "Forbidden path." });
    return true;
  }

  let stat;
  try {
    stat = await fs.promises.stat(candidatePath);
  } catch (_error) {
    return false;
  }

  if (!stat.isFile()) {
    return false;
  }

  const ext = path.extname(candidatePath).toLowerCase();
  const mime = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": mime,
    "Content-Length": stat.size
  });

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  fs.createReadStream(candidatePath).pipe(res);
  return true;
}

async function handleApiCall(req, res) {
  let payload;
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    sendJson(res, 400, { error: error.message });
    return;
  }

  const {
    urlTemplate,
    method = "GET",
    pathParams = {},
    queryParams = [],
    bearerToken = "",
    requestBody = ""
  } = payload || {};

  if (!urlTemplate || String(urlTemplate).trim() === "") {
    sendJson(res, 400, { error: "URL template is required." });
    return;
  }

  const pathParamsFromPayload = pathParams && typeof pathParams === "object" ? pathParams : {};
  const built = buildUrl(String(urlTemplate).trim(), pathParamsFromPayload, queryParams);
  if (built.error) {
    sendJson(res, 400, { error: built.error });
    return;
  }

  const finalUrl = built.url;
  const hasBearerTokenField = Object.prototype.hasOwnProperty.call(payload || {}, "bearerToken");
  const envConfig = loadEnvConfig();
  const effectiveBearerToken = hasBearerTokenField ? String(bearerToken ?? "") : envConfig.bearerToken;
  const curlArgs = buildCurlArgs({
    method,
    finalUrl,
    bearerToken: effectiveBearerToken,
    requestBody: String(requestBody || "")
  });
  const curlCommand = `curl ${curlArgs
    .map((arg) => {
      if (/^[A-Za-z0-9_/:.?=&-]+$/.test(arg)) {
        return arg;
      }
      return `"${arg.replace(/"/g, '\\"')}"`;
    })
    .join(" ")}`;

  let curlResult;
  try {
    curlResult = await executeCurl(curlArgs);
  } catch (error) {
    const notFound = error && error.code === "ENOENT";
    const blocked = error && error.code === "EPERM";
    sendJson(res, 500, {
      error: notFound
        ? "curl was not found on this machine. Install curl and retry."
        : blocked
          ? "curl execution is blocked by OS policy or sandbox permissions."
        : `Failed to execute curl: ${error.message}`,
      request: {
        method: String(method).toUpperCase(),
        finalUrl,
        curlCommand: maskBearerToken(curlCommand),
        body: requestBody || null
      }
    });
    return;
  }

  const parsed = parseCurlResponse(curlResult.stdoutBuffer);
  if (parsed.parseError) {
    sendJson(res, 500, {
      error: parsed.parseError,
      curlExitCode: curlResult.exitCode,
      stderr: curlResult.stderrText || null,
      request: {
        method: String(method).toUpperCase(),
        finalUrl,
        curlCommand: maskBearerToken(curlCommand),
        body: requestBody || null
      },
      rawOutput: parsed.rawOutput
    });
    return;
  }

  const failedByExitCode = curlResult.exitCode !== 0;
  const responsePayload = {
    ok: !failedByExitCode && (parsed.statusCode || 0) < 400,
    curlExitCode: curlResult.exitCode,
    stderr: curlResult.stderrText || null,
    request: {
      method: String(method).toUpperCase(),
      finalUrl,
      curlCommand: maskBearerToken(curlCommand),
      body: requestBody || null
    },
    response: {
      statusCode: parsed.statusCode,
      statusLine: parsed.statusLine,
      headers: parsed.headers,
      elapsedTimeSeconds: parsed.elapsedTimeSeconds,
      body: parsed.responseBody
    }
  };

  sendJson(res, failedByExitCode ? 502 : 200, responsePayload);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/api/call" && req.method === "POST") {
    await handleApiCall(req, res);
    return;
  }

  if (pathname === "/api/config" && req.method === "GET") {
    sendJson(res, 200, { config: loadEnvConfig() });
    return;
  }

  const served = await serveStatic(req, res, pathname);
  if (served) {
    return;
  }

  sendJson(res, 404, { error: "Not found." });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API utility running at http://localhost:${PORT}`);
});
