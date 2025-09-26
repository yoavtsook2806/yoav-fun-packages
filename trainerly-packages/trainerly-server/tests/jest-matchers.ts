declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidISODate(): R;
    }
    
    interface Expect {
      toBeValidUUID(): any;
      toBeValidISODate(): any;
    }
  }
}

export {};
