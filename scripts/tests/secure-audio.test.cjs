const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Minimal hook host: state updates are batched until render(), like React.
function mount(native = true) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const listeners = new Map();
  const audio = {
    currentTime: 0, duration: 120, playCalls: 0,
    canPlayType: () => native ? 'probably' : '',
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
    play() { this.playCalls++; return Promise.resolve(); },
    pause() {}, load() {}, removeAttribute() {},
  };
  const instances = [];
  class Hls {
    static Events = { MANIFEST_PARSED: 'manifest', ERROR: 'error' };
    static ErrorTypes = { NETWORK_ERROR: 'network' };
    static isSupported() { return true; }
    constructor() { this.events = {}; instances.push(this); }
    on(name, callback) { this.events[name] = callback; }
    loadSource() {} attachMedia() {} destroy() {}
  }
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = value; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useCallback(callback) { return callback; },
    useEffect(callback, deps) {
      const i = cursor++;
      if (!slots[i] || !deps || deps.some((dep, j) => dep !== slots[i][j])) effects.push(callback);
      slots[i] = deps;
    },
  };
  const exports = {};
  const compiled = ts.transpileModule(fs.readFileSync('src/hooks/useSecureAudio.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports, require: name => name === 'react' ? react : Hls,
    document: { createElement: () => audio }, console,
  });
  let ended = () => {};
  const render = () => {
    cursor = 0;
    const result = exports.useSecureAudio({ onEnded: () => ended() });
    const pending = effects; effects = [];
    pending.forEach(effect => effect());
    return result;
  };
  return { render, audio, instances, emitEnded: () => listeners.get('ended')(), onEnded: callback => { ended = callback; } };
}

test('native HLS identifies each ready track even when loading state is batched', () => {
  const host = mount();
  let player = host.render();
  player.load('101');
  player = host.render();
  assert.equal(player.readyTrackId, '101');
  player.play();
  host.onEnded(() => player.load('102'));
  host.emitEnded();
  player = host.render();
  assert.equal(player.readyTrackId, '102');
  assert.equal(host.audio.src, '/api/stream/102/playlist');
  player.play();
  assert.equal(host.audio.playCalls, 2);
  assert.equal(host.instances.length, 0, 'native playback takes priority over HLS.js');
});

test('HLS.js only marks the active manifest ready', () => {
  const host = mount(false);
  let player = host.render();
  player.load('101');
  assert.equal(host.render().readyTrackId, null);
  host.instances[0].events.manifest();
  assert.equal(host.render().readyTrackId, '101');
  player.load('102');
  host.instances[0].events.manifest();
  assert.equal(host.render().readyTrackId, null);
  host.instances[1].events.manifest();
  player = host.render();
  assert.equal(player.readyTrackId, '102');
  player.stop();
  assert.equal(host.render().readyTrackId, null);
});

test('a single track can restart on the same audio element', () => {
  const host = mount();
  const player = host.render();
  player.load('101');
  host.audio.currentTime = 120;
  host.onEnded(() => { player.seek(0); player.play(); });
  host.emitEnded();
  assert.equal(host.audio.currentTime, 0);
  assert.equal(host.audio.playCalls, 1);
});
