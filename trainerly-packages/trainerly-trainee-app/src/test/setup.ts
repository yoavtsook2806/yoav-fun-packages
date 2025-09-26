// CRITICAL: This must be first - fix webidl-conversions before any other imports
// The error occurs when webidl-conversions tries to access WeakMap.prototype.get
// and it's undefined in the jsdom environment

// Instead of modifying native prototypes (which are read-only), ensure globals exist
// The key insight is that jsdom might not properly initialize WeakMap/Map globals

// Ensure WeakMap exists and has proper prototype
if (!globalThis.WeakMap) {
  globalThis.WeakMap = WeakMap;
}

// Ensure Map exists and has proper prototype
if (!globalThis.Map) {
  globalThis.Map = Map;
}

// Ensure Set exists and has proper prototype
if (!globalThis.Set) {
  globalThis.Set = Set;
}

// Ensure Symbol exists
if (!globalThis.Symbol) {
  globalThis.Symbol = Symbol;
}

// Make sure global namespace matches globalThis
if (typeof global !== 'undefined') {
  global.WeakMap = globalThis.WeakMap;
  global.Map = globalThis.Map;
  global.Set = globalThis.Set;
  global.Symbol = globalThis.Symbol;
}

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Comprehensive fix for webidl-conversions error in jsdom environment
// The error occurs because webidl-conversions expects certain globals to be available
// and tries to access .get method on WeakMap.prototype

// First, ensure basic globals exist
const requiredGlobals = {
  Symbol: globalThis.Symbol || Symbol,
  WeakMap: globalThis.WeakMap || WeakMap,
  Map: globalThis.Map || Map,
  Set: globalThis.Set || Set,
};

Object.assign(global, requiredGlobals);
Object.assign(globalThis, requiredGlobals);

// Fix for webidl-conversions specifically - it tries to access WeakMap.prototype.get
// Ensure WeakMap prototype has all required methods
if (global.WeakMap && global.WeakMap.prototype) {
  if (!global.WeakMap.prototype.get) {
    global.WeakMap.prototype.get = WeakMap.prototype.get;
  }
  if (!global.WeakMap.prototype.set) {
    global.WeakMap.prototype.set = WeakMap.prototype.set;
  }
  if (!global.WeakMap.prototype.has) {
    global.WeakMap.prototype.has = WeakMap.prototype.has;
  }
  if (!global.WeakMap.prototype.delete) {
    global.WeakMap.prototype.delete = WeakMap.prototype.delete;
  }
}

// Ensure Map prototype methods are available
if (global.Map && global.Map.prototype) {
  if (!global.Map.prototype.get) {
    global.Map.prototype.get = Map.prototype.get;
  }
  if (!global.Map.prototype.set) {
    global.Map.prototype.set = Map.prototype.set;
  }
  if (!global.Map.prototype.has) {
    global.Map.prototype.has = Map.prototype.has;
  }
  if (!global.Map.prototype.delete) {
    global.Map.prototype.delete = Map.prototype.delete;
  }
}

// Mock URL constructor for jsdom compatibility with proper prototype chain
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    href: string;
    protocol: string;
    host: string;
    hostname: string;
    port: string;
    pathname: string;
    search: string;
    hash: string;
    origin: string;

    constructor(url: string, base?: string) {
      this.href = url;
      this.protocol = 'https:';
      this.host = 'localhost';
      this.hostname = 'localhost';
      this.port = '';
      this.pathname = '/';
      this.search = '';
      this.hash = '';
      this.origin = 'https://localhost';
    }

    toString() {
      return this.href;
    }

    // Add static method after class definition
  } as any;
}

// Ensure URLSearchParams is available
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = class URLSearchParams {
    private params = new Map<string, string>();

    constructor(init?: string | URLSearchParams | Record<string, string>) {
      if (typeof init === 'string') {
        // Basic query string parsing
        init.replace(/^\?/, '').split('&').forEach(pair => {
          const [key, value = ''] = pair.split('=');
          if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value));
        });
      }
    }

    get(name: string) { return this.params.get(name); }
    set(name: string, value: string) { this.params.set(name, value); }
    has(name: string) { return this.params.has(name); }
    delete(name: string) { this.params.delete(name); }
    toString() { return Array.from(this.params.entries()).map(([k, v]) => `${k}=${v}`).join('&'); }
  } as any;
}
