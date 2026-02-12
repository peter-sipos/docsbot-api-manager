# DocsBot API Utility (SPA)

Simple Postman-like local utility for DocsBot API testing.

## Features

- URL template input with path params like `:teamId`
- HTTP method selector (`GET`, `POST`, `PUT`, `DELETE`)
- Query parameter editor
- Bearer token input (`Authorization: Bearer ...`)
- Optional `.env` defaults for bearer token, team ID, and bot ID
- Frontend values persist locally and override `.env` defaults
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

Frontend-entered values override these defaults.

## Notes

- This is intended for local/dev use.
- `curl` must be installed and available on your machine path.
