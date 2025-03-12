# eToro MCP Server

This server provides MCP (Model Context Protocol) tools for interacting with eToro's public API endpoints. It allows you to:

1. Fetch a user's portfolio using their username
2. Look up instrument details by IDs
3. Search for instruments by name prefix (autocomplete)

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

4. Start the production server:
   ```
   npm start
   ```

## Available Tools

### fetch_etoro_portfolio

Fetches an eToro user's portfolio using their username. The tool automatically converts the username to a Customer ID (CID) internally.

**Parameters:**
- `username`: The eToro username
- `authToken` (optional): Authorization token for authenticated requests

### fetch_instrument_details

Fetches details for a list of eToro instruments.

**Parameters:**
- `instrumentIds`: List of instrument IDs to fetch details for
- `fields` (optional): Fields to include in the response (defaults to `displayname`, `threeMonthPriceChange`, `oneYearPriceChange`, `lastYearPriceChange`)

### search_instruments

Searches for eToro instruments by name prefix (autocomplete).

**Parameters:**
- `namePrefix`: The prefix to search for in instrument names
- `fields` (optional): Fields to include in the response (defaults to `internalInstrumentId`, `displayname`, `internalClosingPrice`)

## CORS Limitations

Note that some of the eToro API endpoints have CORS restrictions and should be called from a server-side environment. The tools in this server handle these requests on the server side to avoid CORS issues.

## Usage Example

The server exposes a REST API for accessing these tools, which can be called from any HTTP client:

```
GET /tools                          # List all available tools
GET /tools/:name/schema             # Get tool schema
POST /tools/:name/execute           # Execute a tool
```

Example of using the `fetch_etoro_portfolio` tool:

```bash
curl -X POST http://localhost:3000/tools/fetch_etoro_portfolio/execute \
  -H "Content-Type: application/json" \
  -d '{"username": "yoniasia"}'
``` 