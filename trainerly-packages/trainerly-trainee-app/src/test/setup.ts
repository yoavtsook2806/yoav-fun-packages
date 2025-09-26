// CRITICAL: This must be first - fix webidl-conversions before any other imports
// The error occurs when webidl-conversions tries to access WeakMap.prototype.get
// and it's undefined in the jsdom environment

// Polyfill WeakMap completely if it doesn't exist or is incomplete
if (!globalThis.WeakMap || !globalThis.WeakMap.prototype || !globalThis.WeakMap.prototype.get) {
  const originalWeakMap = globalThis.WeakMap || WeakMap;
  
  // Create a proper WeakMap polyfill with all methods
  globalThis.WeakMap = class WeakMap {
    private _data = new Map<any, any>();
    
    constructor(iterable?: readonly [any, any][] | null) {
      if (iterable) {
        for (const [key, value] of iterable) {
          this.set(key, value);
        }
      }
    }
    
    get(key: any): any {
      return this._data.get(key);
    }
    
    set(key: any, value: any): this {
      this._data.set(key, value);
      return this;
    }
    
    has(key: any): boolean {
      return this._data.has(key);
    }
    
    delete(key: any): boolean {
      return this._data.delete(key);
    }
  } as any;
  
  // Ensure prototype methods are available
  globalThis.WeakMap.prototype = globalThis.WeakMap.prototype || {};
  globalThis.WeakMap.prototype.get = globalThis.WeakMap.prototype.get || function(key: any) { return (this as any)._data.get(key); };
  globalThis.WeakMap.prototype.set = globalThis.WeakMap.prototype.set || function(key: any, value: any) { (this as any)._data.set(key, value); return this; };
  globalThis.WeakMap.prototype.has = globalThis.WeakMap.prototype.has || function(key: any) { return (this as any)._data.has(key); };
  globalThis.WeakMap.prototype.delete = globalThis.WeakMap.prototype.delete || function(key: any) { return (this as any)._data.delete(key); };
}

// Also ensure global.WeakMap exists and matches globalThis.WeakMap
if (typeof global !== 'undefined') {
  global.WeakMap = globalThis.WeakMap;
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
