import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
    existsSync,
    readFileSync,
    readdirSync,
} from 'node:fs';
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, '../..');
const results = [];

function test(name, fn) {
    results.push({ name, fn });
}

function walk(directory, predicate = () => true) {
    const files = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...walk(fullPath, predicate));
        } else if (predicate(fullPath)) {
            files.push(fullPath);
        }
    }
    return files;
}

function createGradient() {
    return { addColorStop() {} };
}

function createContext() {
    const target = {
        canvas: null,
        createLinearGradient: createGradient,
        createRadialGradient: createGradient,
        createPattern: () => ({}),
        measureText: text => ({ width: String(text).length * 10 }),
        getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 })
    };

    return new Proxy(target, {
        get(object, property) {
            if (property in object) return object[property];
            return () => {};
        },
        set(object, property, value) {
            object[property] = value;
            return true;
        }
    });
}

function createCanvas(width = 375, height = 812) {
    const context = createContext();
    const canvas = {
        width,
        height,
        getContext: () => context,
        addEventListener() {},
        removeEventListener() {}
    };
    context.canvas = canvas;
    return canvas;
}

function createImage() {
    let source = '';
    return {
        width: 100,
        height: 100,
        complete: true,
        onload: null,
        onerror: null,
        get src() {
            return source;
        },
        set src(value) {
            source = value;
            if (typeof this.onload === 'function') this.onload();
        }
    };
}

globalThis.tt = {
    createCanvas,
    createImage,
    getSystemInfoSync: () => ({
        windowWidth: 375,
        windowHeight: 812,
        screenWidth: 375,
        screenHeight: 812,
        pixelRatio: 3,
        SDKVersion: '99.0.0',
        appVersion: '99.0.0'
    })
};

console.log('Preparing source module loader...');
register(new URL('./esm-loader.mjs', import.meta.url), import.meta.url);

const importRuntime = relativePath => import(pathToFileURL(
    path.join(projectRoot, 'src', relativePath)
).href);

console.log('Loading game modules...');
let CONFIG;
let ENDLESS_CONFIG;
let TARGET_TYPES;
let STAMINA_CONFIG;
let GameState;
let GameStateManager;
let SpawnManager;
let ParticleTarget;
let Vector2;
let BackgroundRenderer;

try {
    ({ CONFIG, ENDLESS_CONFIG, TARGET_TYPES, STAMINA_CONFIG } =
        await importRuntime('config.js'));
    ({ GameState, GameStateManager } =
        await importRuntime('managers/GameStateManager.js'));
    ({ SpawnManager } = await importRuntime('managers/SpawnManager.js'));
    ({ ParticleTarget } = await importRuntime('entities/ParticleTarget.js'));
    ({ Vector2 } = await importRuntime('utils/Vector2.js'));
    ({ BackgroundRenderer } =
        await importRuntime('renderers/BackgroundRenderer.js'));
} catch (error) {
    console.error('Unable to load game modules:', error);
    process.exitCode = 1;
    throw error;
}

test('all production JavaScript files pass syntax checking', () => {
    const files = [
        path.join(projectRoot, 'game.js'),
        ...walk(path.join(projectRoot, 'src'), file => file.endsWith('.js'))
    ];
    for (const file of files) {
        execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    }
});

test('all static local media references exist', () => {
    const files = [
        path.join(projectRoot, 'game.js'),
        ...walk(path.join(projectRoot, 'src'), file => file.endsWith('.js'))
    ];
    const missing = new Set();
    const mediaPattern =
        /['"`](\/?(?:assets|backgrounds|music|target)\/[^'"`?]+\.(?:png|jpe?g|mp3|wav|json))['"`]/gi;

    for (const file of files) {
        const source = readFileSync(file, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/^\s*\/\/.*$/gm, '');
        for (const match of source.matchAll(mediaPattern)) {
            const relativePath = match[1].replace(/^[/\\]/, '');
            if (relativePath.includes('${')) continue;
            if (!existsSync(path.join(projectRoot, relativePath))) {
                missing.add(relativePath);
            }
        }
    }

    assert.deepEqual([...missing].sort(), []);
    assert.ok(existsSync(path.join(projectRoot, STAMINA_CONFIG.SHARE.imageUrl)));
});

test('target identifiers are unique and core attributes are valid', () => {
    const ids = TARGET_TYPES.map(target => target.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const target of TARGET_TYPES) {
        assert.ok(target.id);
        assert.ok(target.radius > 0, `${target.id}: radius must be positive`);
        assert.ok(target.speed >= 0, `${target.id}: speed must be non-negative`);
        assert.ok(target.points > 0, `${target.id}: points must be positive`);
        assert.ok(target.movement, `${target.id}: movement is required`);
    }
});

test('timed game counts down, scores, and reaches game over', () => {
    const manager = new GameStateManager();
    const target = TARGET_TYPES[0];
    manager.startGame(target, false);
    assert.equal(manager.getState(), GameState.PLAYING);
    assert.equal(manager.timeLeft, CONFIG.GAME_DURATION);

    manager.addScore(7);
    assert.equal(manager.score, 7);
    assert.equal(manager.getHitCount(), 1);

    const countdown = manager.update(CONFIG.GAME_DURATION - 10);
    assert.equal(manager.timeLeft, 10);
    assert.equal(countdown.shouldPlayCountdown, true);

    const ended = manager.update(10);
    assert.equal(ended.shouldEndGame, true);
    assert.equal(manager.timeLeft, 0);
});

test('endless mode keeps running and randomizes within configured ranges', () => {
    const manager = new GameStateManager();
    manager.startEndlessMode(TARGET_TYPES[0]);
    const result = manager.update(ENDLESS_CONFIG.ATTRIBUTE_CHANGE_INTERVAL / 1000);
    assert.equal(result.shouldEndGame, false);
    assert.equal(manager.timeLeft, Infinity);

    const ranges = [
        ['speed', ENDLESS_CONFIG.SPEED_MULTIPLIER_RANGE],
        ['radius', ENDLESS_CONFIG.RADIUS_MULTIPLIER_RANGE],
        ['points', ENDLESS_CONFIG.POINTS_MULTIPLIER_RANGE]
    ];
    for (const [key, [min, max]] of ranges) {
        assert.ok(manager.currentMultipliers[key] >= min);
        assert.ok(manager.currentMultipliers[key] <= max);
    }
});

test('spawn manager respects max target count and creates configured type', () => {
    const settings = {
        getSpawnInterval: () => 100,
        getMaxTargets: () => 2,
        getSpeedMultiplier: () => 1
    };
    const manager = new SpawnManager(settings);
    const params = {
        canvasWidth: 375,
        canvasHeight: 812,
        selectedTarget: TARGET_TYPES.find(target => target.id === 'sparkle'),
        isEndlessMode: false,
        multipliers: { speed: 1, radius: 1, points: 1 }
    };

    assert.equal(manager.update(0.2, { ...params, targets: [{}, {}] }), null);
    const spawned = manager.update(0.2, { ...params, targets: [{}] });
    assert.ok(spawned instanceof ParticleTarget);
});

test('particle targets render repeatedly without DOM APIs', () => {
    const config = TARGET_TYPES.find(target => target.id === 'sparkle');
    const target = new ParticleTarget(new Vector2(100, 100), config);
    const ctx = createContext();
    target.render(ctx);
    const firstCache = target._particleSpriteCache;
    target.update(1 / 60, 375, 812);
    target.render(ctx);
    assert.equal(target._particleSpriteCache, firstCache);
});

test('every configured target survives sustained update and render cycles', () => {
    const renderer = {
        render() {},
        update() {},
        reset() {}
    };
    const manager = new SpawnManager(
        null,
        null,
        renderer,
        renderer,
        renderer,
        renderer,
        renderer,
        renderer,
        renderer,
        renderer,
        renderer,
        renderer,
        renderer
    );
    const ctx = createContext();

    for (const selectedTarget of TARGET_TYPES) {
        const target = manager.spawnTarget({
            canvasWidth: 375,
            canvasHeight: 812,
            selectedTarget,
            isEndlessMode: false,
            multipliers: { speed: 1, radius: 1, points: 1 }
        });
        for (let frame = 0; frame < 180; frame++) {
            target.update(1 / 60, 375, 812);
            target.render(ctx);
        }
        assert.ok(Number.isFinite(target.position.x), selectedTarget.id);
        assert.ok(Number.isFinite(target.position.y), selectedTarget.id);
    }
});

test('every special background renders without throwing', () => {
    const canvas = createCanvas();
    const renderer = new BackgroundRenderer(canvas, canvas.getContext('2d'));
    renderer.resize(2);
    const targetIds = [
        'sparkle', 'laser', 'butterfly', 'fish', 'yarn', 'ladybug',
        'mosquito', 'jellyfish', 'bubblefish', 'captain', 'octopus',
        'bear', 'seagull'
    ];
    for (const targetId of targetIds) {
        renderer.render(null, true, targetId, 1);
    }
});

let failed = 0;
for (const entry of results) {
    try {
        await entry.fn();
        console.log(`PASS ${entry.name}`);
    } catch (error) {
        failed++;
        console.error(`FAIL ${entry.name}`);
        console.error(error && error.stack ? error.stack : error);
    }
}

console.log(`\n${results.length - failed}/${results.length} tests passed`);
process.exitCode = failed ? 1 : 0;
