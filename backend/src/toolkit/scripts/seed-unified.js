"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const tsyringe_1 = require("tsyringe");
const core_1 = require("../core");
const infrastructure_1 = require("../infrastructure");
const seed_unified_command_1 = require("../commands/seed-unified.command");
const scenario_loader_1 = require("../scenarios/scenario-loader");
const fixture_provider_1 = require("../fixtures/fixture-provider");
const output_path_policy_1 = require("../core/output-path-policy");
function parseFlags(argv) {
    const flags = {};
    let positional;
    for (const arg of argv) {
        if (arg.startsWith('--')) {
            const [key, rawValue] = arg.slice(2).split('=');
            flags[key] = rawValue === undefined ? true : rawValue;
        }
        else if (!positional) {
            positional = arg;
        }
    }
    return { flags, positional };
}
function readString(flags, key) {
    const value = flags[key];
    return typeof value === 'string' ? value : undefined;
}
function readInt(flags, key, fallback) {
    const value = readString(flags, key);
    if (!value)
        return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}
async function main() {
    const { flags, positional } = parseFlags(process.argv.slice(2));
    const scenario = positional || readString(flags, 'scenario');
    const tenantId = readString(flags, 'tenant');
    const mode = (readString(flags, 'mode') || 'GENERATED');
    if (!scenario || !tenantId) {
        console.error('Usage: seed-unified.ts <scenario-id> --tenant=<tenant-id> [--mode=GENERATED|FIXTURE|HYBRID] [--seed=12345] [--days=30] [--platforms=google,facebook,tiktok,line,shopee,lazada] [--no-dry-run] [--allow-real-tenant] [--manifest-dir=<dir>]');
        process.exit(2);
    }
    const commandParams = {
        tenant: tenantId,
        scenario,
        mode,
        seed: readInt(flags, 'seed', 12345),
        days: readInt(flags, 'days', 30),
        platforms: readString(flags, 'platforms'),
        dryRun: !Boolean(flags['no-dry-run']),
        allowRealTenant: Boolean(flags['allow-real-tenant']),
    };
    const manifestDir = readString(flags, 'manifest-dir');
    let resolvedManifestDir;
    try {
        resolvedManifestDir = manifestDir ? (0, output_path_policy_1.resolveOutputDir)('manifest', manifestDir) : undefined;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Seed Pipeline Fatal Error: ${message}`);
        process.exit(error instanceof output_path_policy_1.OutputPathPolicyError ? error.exitCode : 78);
    }
    try {
        const config = (0, core_1.loadConfiguration)();
        (0, core_1.initializeContainer)(config);
        core_1.ServiceLocator.register(core_1.TOKENS.Logger, infrastructure_1.PinoLogger);
        tsyringe_1.container.register(seed_unified_command_1.SeedUnifiedCommandHandler, { useClass: seed_unified_command_1.SeedUnifiedCommandHandler });
        tsyringe_1.container.register(scenario_loader_1.ScenarioLoader, { useClass: scenario_loader_1.ScenarioLoader });
        tsyringe_1.container.registerInstance(fixture_provider_1.FixtureProvider, new fixture_provider_1.FixtureProvider());
        const handler = tsyringe_1.container.resolve(seed_unified_command_1.SeedUnifiedCommandHandler);
        const result = await handler.runWithManifest(commandParams, resolvedManifestDir);
        console.log(`Seed Pipeline Status: ${result.status}`);
        console.log(`Exit Code: ${result.exitCode}`);
        if (result.manifestPath) {
            console.log(`Manifest: ${result.manifestPath}`);
        }
        const writesApplied = result.manifest?.results?.writesApplied?.actualCounts?.totalRows;
        const writesPlanned = result.manifest?.results?.writesPlanned?.estimatedCounts?.totalRows;
        if (commandParams.dryRun) {
            if (typeof writesPlanned === 'number') {
                console.log(`Rows Planned (Dry Run): ${writesPlanned}`);
            }
            console.log(`Rows Applied: ${typeof writesApplied === 'number' ? writesApplied : 0}`);
        }
        else if (typeof writesApplied === 'number') {
            console.log(`Rows Created: ${writesApplied}`);
        }
        process.exit(result.exitCode);
    }
    catch (error) {
        console.error(`Seed Pipeline Fatal Error: ${error?.message || String(error)}`);
        process.exit(1);
    }
    finally {
        await (0, core_1.disposeContainer)();
    }
}
main();
//# sourceMappingURL=seed-unified.js.map