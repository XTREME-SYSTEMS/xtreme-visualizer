// Ambient declarations for Deno runtime APIs and npm: imports.
// Used ONLY by tsconfig.backend.json for static type validation of base44/functions/**/*.ts.
// These are NOT used at runtime — Deno provides the real implementations.

declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get(name: string): string | undefined;
  };
};

declare module "npm:@base44/sdk@*" {
  // The SDK client is complex and platform-owned; returning any lets tsc validate
  // the app's own logic without false-positive "property does not exist" errors.
  export function createClientFromRequest(req: Request): any;
}

declare module "base44:runtime" {
  export function createClientFromRequest(req: Request): any;
  export const secrets: any;
}

declare module "npm:jose@*" {
  export function importSPKI(pem: string, alg: string): Promise<any>;
  export function jwtVerify(token: string, key: any): Promise<{ payload: any }>;
}