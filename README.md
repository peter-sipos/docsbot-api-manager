# DocsBot API Utility (SPA)

Simple Postman-like local utility for DocsBot API testing.

## Features

- URL template input with path params like `:teamId`
- HTTP method selector (`GET`, `POST`, `PUT`, `DELETE`)
- Query parameter editor
- Bearer token input (`Authorization: Bearer ...`)
- Optional server-side `.env` fallback for bearer token, team ID, and bot ID
- Frontend values persist locally in your browser for convenience
- Request body input
- Requests executed through `curl` on the server
- Request preview (`final URL`, `curl command`, request body)
- Response display (`status`, `headers`, `body`, elapsed time)

## Run

```bash
npm start
```

Open `http://localhost:3100`.

## Optional .env

Create a `.env` file in the project root (see `.env.sample`) to preload:

- `DOCSBOT_API_KEY`
- `DOCSBOT_TEAM_ID`
- `DOCSBOT_BOT_ID`

The `.env` file is read only by the Node server and is not exposed via frontend API.
Request values entered in the UI take precedence; `.env` is used as fallback.
`.env` is loaded once at server startup and reused for the app lifecycle.
If you change `.env`, restart the server.

## Notes

- This is intended for local/dev use.
- `curl` must be installed and available on your machine path.
