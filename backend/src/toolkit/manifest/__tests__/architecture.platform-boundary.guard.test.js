"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert/strict"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const TOOLKIT_ROOT = path.resolve(__dirname, '..', '..');
function collectTsFiles(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', 'dist', '__tests__', '.git'].includes(entry.name))
                continue;
            results.push(...collectTsFiles(fullPath));
        }
        else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}
function toRepoRelative(absPath) {
    const backendRoot = path.resolve(TOOLKIT_ROOT, '..', '..');
    return path.relative(backendRoot, absPath).replace(/\\/g, '/');
}
(0, node_test_1.describe)('Guard: AdPlatform coupling confined to mapper', () => {
    const BOUNDARY_FILE = path.resolve(TOOLKIT_ROOT, 'core', 'platform.mapper.ts');
    const KNOWN_TRANSITION_DEBT = [
        path.resolve(TOOLKIT_ROOT, 'services', 'google-ads-seeder.service.ts'),
        path.resolve(TOOLKIT_ROOT, 'commands', 'seed-data.command.ts'),
    ];
    const ALLOWED_FILES = new Set([
        BOUNDARY_FILE,
        ...KNOWN_TRANSITION_DEBT,
    ].map(f => path.normalize(f)));
    (0, node_test_1.it)('no toolkit file outside boundary + known-debt imports AdPlatform from @prisma/client', () => {
        const allFiles = collectTsFiles(TOOLKIT_ROOT);
        const violations = [];
        const IMPORT_PATTERN = /import\s+\{[^}]*\bAdPlatform\b[^}]*\}\s+from\s+['"]@prisma\/client['"]/;
        for (const file of allFiles) {
            const normalized = path.normalize(file);
            if (ALLOWED_FILES.has(normalized))
                continue;
            const content = fs.readFileSync(file, 'utf-8');
            const lines = content.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                if (IMPORT_PATTERN.test(lines[i])) {
                    violations.push({
                        file: toRepoRelative(file),
                        line: i + 1,
                        content: lines[i].trim(),
                    });
                }
            }
        }
        if (violations.length > 0) {
            const report = violations
                .map(v => `  ${v.file}:${v.line} → ${v.content}`)
                .join('\n');
            assert.fail(`AdPlatform coupling detected outside boundary!\n` +
                `Allowed: src/toolkit/core/platform.mapper.ts\n` +
                `Known debt: ${KNOWN_TRANSITION_DEBT.map(toRepoRelative).join(', ')}\n` +
                `New violations:\n${report}`);
        }
    });
    (0, node_test_1.it)('known transition debt is exactly 2 files (no silent growth)', () => {
        assert.equal(KNOWN_TRANSITION_DEBT.length, 2, 'Transition debt count changed! Update this test if debt was intentionally added/removed.');
    });
    (0, node_test_1.it)('boundary file (platform.mapper.ts) exists and imports AdPlatform', () => {
        assert.ok(fs.existsSync(BOUNDARY_FILE), `Boundary file missing: ${toRepoRelative(BOUNDARY_FILE)}`);
        const content = fs.readFileSync(BOUNDARY_FILE, 'utf-8');
        assert.match(content, /import\s+\{[^}]*\bAdPlatform\b[^}]*\}\s+from\s+['"]@prisma\/client['"]/, 'Boundary file should import AdPlatform from @prisma/client');
    });
});
(0, node_test_1.describe)('Guard: platform availability derived from capabilities', () => {
    const capabilitiesPath = path.resolve(TOOLKIT_ROOT, 'domain', 'platform-capabilities.ts');
    const typesPath = path.resolve(TOOLKIT_ROOT, 'domain', 'platform.types.ts');
    (0, node_test_1.it)('SEEDABLE_PLATFORMS includes Shopee and Lazada when configured as seedable', () => {
        const { PLATFORM_CAPABILITIES, SEEDABLE_PLATFORMS } = require(capabilitiesPath);
        const { ToolkitPlatform } = require(typesPath);
        assert.equal(PLATFORM_CAPABILITIES[ToolkitPlatform.Shopee]?.isSeedable, true, 'Shopee should be configured as seedable in PLATFORM_CAPABILITIES');
        assert.equal(PLATFORM_CAPABILITIES[ToolkitPlatform.Lazada]?.isSeedable, true, 'Lazada should be configured as seedable in PLATFORM_CAPABILITIES');
        assert.ok(SEEDABLE_PLATFORMS.includes(ToolkitPlatform.Shopee), `SEEDABLE_PLATFORMS must include Shopee. Got: [${SEEDABLE_PLATFORMS.join(', ')}]`);
        assert.ok(SEEDABLE_PLATFORMS.includes(ToolkitPlatform.Lazada), `SEEDABLE_PLATFORMS must include Lazada. Got: [${SEEDABLE_PLATFORMS.join(', ')}]`);
        console.log(`    ✓ SEEDABLE_PLATFORMS = [${SEEDABLE_PLATFORMS.join(', ')}]`);
    });
    (0, node_test_1.it)('SIMULATABLE_PLATFORMS includes Shopee and Lazada when configured', () => {
        const { PLATFORM_CAPABILITIES, SIMULATABLE_PLATFORMS } = require(capabilitiesPath);
        const { ToolkitPlatform } = require(typesPath);
        assert.equal(PLATFORM_CAPABILITIES[ToolkitPlatform.Shopee]?.isSimulatable, true, 'Shopee should be configured as simulatable');
        assert.equal(PLATFORM_CAPABILITIES[ToolkitPlatform.Lazada]?.isSimulatable, true, 'Lazada should be configured as simulatable');
        assert.ok(SIMULATABLE_PLATFORMS.includes(ToolkitPlatform.Shopee), `SIMULATABLE_PLATFORMS must include Shopee. Got: [${SIMULATABLE_PLATFORMS.join(', ')}]`);
        assert.ok(SIMULATABLE_PLATFORMS.includes(ToolkitPlatform.Lazada), `SIMULATABLE_PLATFORMS must include Lazada. Got: [${SIMULATABLE_PLATFORMS.join(', ')}]`);
        console.log(`    ✓ SIMULATABLE_PLATFORMS = [${SIMULATABLE_PLATFORMS.join(', ')}]`);
    });
});
(0, node_test_1.describe)('Guard: PLATFORM_CONFIGS covers all simulatable platforms', () => {
    (0, node_test_1.it)('every simulatable platform has a config entry in PLATFORM_CONFIGS', () => {
        const configsPath = path.resolve(TOOLKIT_ROOT, 'platform-configs.ts');
        const capabilitiesPath2 = path.resolve(TOOLKIT_ROOT, 'domain', 'platform-capabilities.ts');
        const { PLATFORM_CONFIGS } = require(configsPath);
        const { SIMULATABLE_PLATFORMS } = require(capabilitiesPath2);
        const missing = [];
        for (const platform of SIMULATABLE_PLATFORMS) {
            if (!PLATFORM_CONFIGS[platform]) {
                missing.push(platform);
            }
        }
        assert.equal(missing.length, 0, `Missing PLATFORM_CONFIGS entries for simulatable platforms: [${missing.join(', ')}]`);
        console.log(`    ✓ All ${SIMULATABLE_PLATFORMS.length} simulatable platforms have config entries`);
    });
});
//# sourceMappingURL=architecture.platform-boundary.guard.test.js.map