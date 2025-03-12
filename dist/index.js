import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express from "express";
import { z } from 'zod';
import { config } from './config.js';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
export const DEFAULT_ACCESS_TOKEN = "default-token";
export const DEFAULT_BASE_URL = "http://stg-streams-back-api.dev.local";
// Utility function to handle HTTP responses from components
export async function handleResponse(response) {
    if (!response.ok) {
        let errorMessage;
        try {
            const errorData = await response.json();
            errorMessage = errorData?.error || response.statusText;
        }
        catch {
            errorMessage = response.statusText;
        }
        const error = {
            code: response.status,
            message: errorMessage
        };
        throw error;
    }
    return response.json();
}
// Utility function to handle HTTP responses for the server
function handleHttpResponse(res, data, error) {
    if (error) {
        return res.status(error.code || 500).json({ error: error.message || "Internal server error" });
    }
    return res.json(data);
}
// Utility function to handle JSON-RPC responses
async function handleApiResponse(response) {
    const result = await response;
    if (!result) {
        throw {
            code: 500,
            message: "Received undefined response from transport"
        };
    }
    if (result.error) {
        throw result.error;
    }
    return result.result;
}
// Register eToro portfolio tools
function registerEToroTools(server) {
    // Fetch eToro portfolio
    server.tool("fetch_etoro_portfolio", "Fetch an eToro user's portfolio using their username", {
        username: z.string().describe("The eToro username"),
        authToken: z.string().optional().describe("Optional: Authorization token for authenticated requests")
    }, async (params) => {
        const { username, authToken = "" } = params;
        try {
            // First, convert username to CID
            const cidResponse = await fetch(`https://helpers.bullsheet.me/api/cid?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'referer': 'https://helpers.bullsheet.me/',
                    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
                }
            });
            if (!cidResponse.ok) {
                throw new Error(`Failed to convert username to CID: ${cidResponse.statusText}`);
            }
            const cidData = await cidResponse.json();
            const cid = cidData.cid;
            if (!cid) {
                throw new Error(`Failed to retrieve CID for username: ${username}`);
            }
            // Generate a client request ID (UUID-like format)
            const clientRequestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            // Now fetch the portfolio using the retrieved CID
            const response = await fetch(`https://www.etoro.com/sapi/trade-data-real/live/public/portfolios?cid=${cid}&client_request_id=${clientRequestId}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'accounttype': 'Real',
                    'applicationidentifier': 'ReToro',
                    'applicationversion': 'v651.621.3',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                    ...(authToken ? { 'authorization': authToken } : {})
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch portfolio data: ${response.statusText}`);
            }
            const portfolioData = await response.json();
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify({
                            username,
                            cid,
                            portfolio: portfolioData
                        }, null, 2)
                    }],
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch portfolio data: ${error.message}`);
            }
            throw error;
        }
    });
    // Fetch instrument details
    server.tool("fetch_instrument_details", "Fetch details for a list of eToro instruments", {
        instrumentIds: z.array(z.number()).describe("List of instrument IDs to fetch details for"),
        fields: z.array(z.string())
            .default(['displayname', 'threeMonthPriceChange', 'oneYearPriceChange', 'lastYearPriceChange'])
            .describe("Fields to include in the response")
    }, async (params) => {
        const { instrumentIds, fields } = params;
        try {
            const instrumentIdsString = instrumentIds.join(',');
            const fieldsString = fields.join(',');
            // This should be run server-side due to CORS limitations
            const response = await fetch(`https://www.etoro.com/sapi/instrumentsinfo/Instruments?internalInstrumentId=${instrumentIdsString}&fields=${fieldsString}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch instrument details: ${response.statusText}`);
            }
            const instrumentData = await response.json();
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(instrumentData, null, 2)
                    }],
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch instrument details: ${error.message}`);
            }
            throw error;
        }
    });
    // Search instruments by name prefix (autocomplete)
    server.tool("search_instruments", "Search for eToro instruments by name prefix (autocomplete)", {
        namePrefix: z.string().describe("The prefix to search for in instrument names"),
        fields: z.array(z.string())
            .default(['internalInstrumentId', 'displayname', 'internalClosingPrice'])
            .describe("Fields to include in the response")
    }, async (params) => {
        const { namePrefix, fields } = params;
        try {
            const fieldsString = fields.join(',');
            // This should be run server-side due to CORS limitations
            const response = await fetch(`https://www.etoro.com/sapi/instrumentsinfo/Instruments?displayname=${encodeURIComponent(namePrefix)}&fields=${fieldsString}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-US,en;q=0.9',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                }
            });
            if (!response.ok) {
                throw new Error(`Failed to search instruments: ${response.statusText}`);
            }
            const searchResults = await response.json();
            return {
                content: [{
                        type: "text",
                        text: JSON.stringify(searchResults, null, 2)
                    }],
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to search instruments: ${error.message}`);
            }
            throw error;
        }
    });
}
async function main() {
    console.error("Starting eToro MCP server...");
    try {
        // Initialize the MCP server
        const server = new McpServer({
            name: config.server.name,
            version: config.server.version
        });
        // Register eToro tools
        registerEToroTools(server);
        console.error("eToro tools registered successfully");
        // Create and connect the transport
        const transport = new StdioServerTransport();
        try {
            await server.connect(transport);
            console.error("Server connected to transport successfully");
        }
        catch (transportError) {
            console.error("Failed to connect to transport:", transportError);
            throw new Error(`Transport connection failed: ${transportError instanceof Error ? transportError.message : String(transportError)}`);
        }
        // Verify transport is working by listing tools
        try {
            const request = {
                jsonrpc: "2.0",
                id: Date.now(),
                method: "listTools"
            };
            const response = await transport.send(request);
            console.error("Transport test successful, tools available:", response);
        }
        catch (testError) {
            console.error("Transport test failed:", testError);
            // Continue anyway, as this is just a test
        }
        // Set up Express server
        let transportSSE = undefined;
        const app = express();
        app.get("/sse", async (req, res) => {
            console.error(`[${new Date().toISOString()}] SSE connection established from ${req.ip}`);
            transportSSE = new SSEServerTransport("/messages", res);
            console.error(`[${new Date().toISOString()}] Created SSE transport at /messages`);
            try {
                await server.connect(transportSSE);
                console.error(`[${new Date().toISOString()}] Server connected to transport successfully`);
            }
            catch (error) {
                console.error(`[${new Date().toISOString()}] Error connecting server to transport:`, error);
            }
            // Log when SSE connection closes
            req.on('close', () => {
                console.error(`[${new Date().toISOString()}] SSE connection closed from ${req.ip}`);
                transportSSE = undefined;
            });
        });
        app.post("/messages", async (req, res) => {
            console.error(`[${new Date().toISOString()}] Received message POST request from ${req.ip}`);
            if (!transportSSE) {
                console.error(`[${new Date().toISOString()}] No SSE transport available for message handling`);
                res.status(400);
                res.json({ error: "No transport" });
                return;
            }
            try {
                await transportSSE.handlePostMessage(req, res);
                console.error(`[${new Date().toISOString()}] Successfully handled message POST request`);
            }
            catch (error) {
                console.error(`[${new Date().toISOString()}] Error handling message POST request:`, error);
                res.status(500);
                res.json({ error: "Internal server error" });
            }
        });
        // Start the HTTP server
        const { port, host } = config.server;
        app.listen(port, () => {
            console.error(`Server is running on http://${host}:${port}`);
            console.error(`SSE endpoint available at http://${host}:${port}${config.sse.path}`);
        });
    }
    catch (error) {
        console.error("Error starting server:", error);
        process.exit(1);
    }
}
main().catch(console.error);
