import { parseArgs } from "util";
import { createClient } from "@supabase/supabase-js";
import { Config } from "./modules/vircadia-world-sdk-ts/shared/modules/vircadia-world-meta/typescript/meta.ts";
import { log } from "./modules/vircadia-world-sdk-ts/shared/modules/general/log.ts";
import { startBabylonScriptBundleService } from "./modules/services/babylon-script-bundle-service.ts";

function loadConfig(): {
    [Config.E_SERVER_CONFIG.SERVER_DEBUG]: boolean;
    [Config.E_SERVER_CONFIG.SERVER_CADDY_HOST]: string;
    [Config.E_SERVER_CONFIG.SERVER_CADDY_PORT]: number;
    [Config.E_SERVER_CONFIG.SERVER_PORT]: number;
    [Config.E_SERVER_CONFIG.SERVER_HOST]: string;
    [Config.E_SERVER_CONFIG.FORCE_RESTART_SUPABASE]: boolean;
    [Config.E_AGENT_CONFIG.AGENT_DEBUG]: boolean;
    [Config.E_AGENT_CONFIG.AGENT_DEFAULT_WORLD_HOST]: string;
    [Config.E_AGENT_CONFIG.AGENT_USE_SERVICE_SCRIPT_BUNDLE]: boolean;
} {
    const args = parseArgs({
        args: process.argv.slice(2),
        options: {
            debug: { type: "boolean" },
            caddyHost: { type: "string" },
            caddyPort: { type: "string" },
            serverPort: { type: "string" },
            serverHost: { type: "string" },
            forceRestartSupabase: { type: "boolean" },
            agentDebug: { type: "boolean" },
            worldHost: { type: "string" },
            useScriptBundle: { type: "boolean" },
        },
    });

    // Server configs
    const debugMode = process.env[Config.E_SERVER_CONFIG.SERVER_DEBUG] === "true" || args.values.debug === true || false;
    const caddyHost = process.env[Config.E_SERVER_CONFIG.SERVER_CADDY_HOST] || args.values.caddyHost || "localhost";
    const caddyPort = Number.parseInt(process.env[Config.E_SERVER_CONFIG.SERVER_CADDY_PORT] || args.values.caddyPort?.toString() || "3010");
    const serverPort = Number.parseInt(process.env[Config.E_SERVER_CONFIG.SERVER_PORT] || args.values.serverPort?.toString() || "3020");
    const serverHost = process.env[Config.E_SERVER_CONFIG.SERVER_HOST] || args.values.serverHost || "localhost";
    const forceRestartSupabase = process.env[Config.E_SERVER_CONFIG.FORCE_RESTART_SUPABASE] === "true" || args.values.forceRestartSupabase || false;

    // Agent configs
    const agentDebug = process.env[Config.E_AGENT_CONFIG.AGENT_DEBUG] === "true" || args.values.agentDebug === true || false;
    const defaultWorldHost = process.env[Config.E_AGENT_CONFIG.AGENT_DEFAULT_WORLD_HOST] || args.values.worldHost || "http://localhost:3000";
    const useScriptBundle = process.env[Config.E_AGENT_CONFIG.AGENT_USE_SERVICE_SCRIPT_BUNDLE] === "true" || args.values.useScriptBundle === true || false;

    return {
        [Config.E_SERVER_CONFIG.SERVER_DEBUG]: debugMode,
        [Config.E_SERVER_CONFIG.SERVER_CADDY_HOST]: caddyHost,
        [Config.E_SERVER_CONFIG.SERVER_CADDY_PORT]: caddyPort,
        [Config.E_SERVER_CONFIG.SERVER_PORT]: serverPort,
        [Config.E_SERVER_CONFIG.SERVER_HOST]: serverHost,
        [Config.E_SERVER_CONFIG.FORCE_RESTART_SUPABASE]: forceRestartSupabase,
        [Config.E_AGENT_CONFIG.AGENT_DEBUG]: agentDebug,
        [Config.E_AGENT_CONFIG.AGENT_DEFAULT_WORLD_HOST]: defaultWorldHost,
        [Config.E_AGENT_CONFIG.AGENT_USE_SERVICE_SCRIPT_BUNDLE]: useScriptBundle,
    };
}

async function main() {
    const config = loadConfig();
    
    // Initialize Supabase client
    const supabase = createClient(
        config[Config.E_AGENT_CONFIG.AGENT_DEFAULT_WORLD_HOST],
        process.env.SUPABASE_ANON_KEY || "" // Make sure to set this in your .env file
    );

    // Start the Babylon Script Bundle Service if enabled
    if (config[Config.E_AGENT_CONFIG.AGENT_USE_SERVICE_SCRIPT_BUNDLE]) {
        try {
            await startBabylonScriptBundleService({
                debug: config[Config.E_AGENT_CONFIG.AGENT_DEBUG],
                supabase
            });
            log({
                message: "Babylon Script Bundle Service initialized successfully",
                type: "success",
                debug: config[Config.E_AGENT_CONFIG.AGENT_DEBUG]
            });
        } catch (error) {
            log({
                message: `Failed to initialize Babylon Script Bundle Service: ${error}`,
                type: "error",
                debug: config[Config.E_AGENT_CONFIG.AGENT_DEBUG]
            });
        }
    }
}

main().catch(error => {
    console.error("Application failed to start:", error);
    process.exit(1);
});