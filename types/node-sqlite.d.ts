// Minimal declarations for the Node 22.13+ built-in SQLite API used here.
// The repository currently ships Node 20 type definitions.
declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      run(...params: (string | number | null)[]): { changes: number | bigint };
      get(...params: (string | number | null)[]): Record<string, unknown> | undefined;
      all(...params: (string | number | null)[]): Record<string, unknown>[];
    };
    close(): void;
  }
}
