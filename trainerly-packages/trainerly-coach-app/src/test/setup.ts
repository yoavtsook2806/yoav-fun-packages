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

// Ensure all required globals are available
Object.assign(global, {
  Symbol: global.Symbol || Symbol,
  WeakMap: global.WeakMap || WeakMap,
  Map: global.Map || Map,
  Set: global.Set || Set,
});

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
