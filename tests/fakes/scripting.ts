import { notImplemented } from '@/core/not-implemented';

export type RegisteredScript = {
  id: string;
  matches?: string[];
  js?: string[];
  runAt?: 'document_start' | 'document_end' | 'document_idle';
  allFrames?: boolean;
  persistAcrossSessions?: boolean;
  world?: 'ISOLATED' | 'MAIN';
};

export type Injection = { tabId: number; files?: string[] };

export type FakeScriptingApi = {
  registerContentScripts(scripts: RegisteredScript[]): Promise<void>;
  updateContentScripts(scripts: RegisteredScript[]): Promise<void>;
  unregisterContentScripts(filter?: { ids?: string[] }): Promise<void>;
  getRegisteredContentScripts(filter?: { ids?: string[] }): Promise<RegisteredScript[]>;
  executeScript(injection: {
    target: { tabId: number; allFrames?: boolean };
    files?: string[];
  }): Promise<{ frameId: number; result?: unknown }[]>;
};

export type FakeScripting = {
  api: FakeScriptingApi;
  readonly registered: readonly RegisteredScript[];
  readonly injections: readonly Injection[];
  /** Make injections into this tab reject, like a restricted page. */
  failInjection(tabId: number, message: string): void;
};

export function createFakeScripting(): FakeScripting {
  return notImplemented();
}
