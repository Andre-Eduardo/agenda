# App agenda

## Requirements

- Node.js 20
- Pnpm 9
- [Docker](https://docs.docker.com/compose/install)

## Installation

First, clone the repository using the following command:

```bash
```

Next, install the dependencies:

```bash
# Enter the project directory
cd agenda-app

# Install the dependencies
pnpm install
```

## Environment variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable          | Description                                                                 |
|-------------------|-----------------------------------------------------------------------------|
| `STITCH_API_KEY`  | API key for the Stitch MCP server (used by `.mcp.json` via `${STITCH_API_KEY}`) |

The `.env` file is git-ignored. Never commit real keys.

## Running

To proceed, make sure you have [Docker](https://docs.docker.com/compose/install) installed and running on your machine.

```bash
pnpm run start:dev:full
```

The application will be available at [http://localhost:5173](http://localhost:5173).

This is a quick way to see the application working. For development purposes, we recommend accessing the README.md file
of each app or package to know how to run them individually and start coding 🚀.