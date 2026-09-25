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
  const registered = new Map<string, RegisteredScript>();
  const injections: Injection[] = [];
  const failures = new Map<number, string>();

  const requireKnown = (ids: string[]) => {
    const unknown = ids.find((id) => !registered.has(id));
    if (unknown) throw new Error(`Nonexistent script ID '${unknown}'`);
  };
  const select = (ids?: string[]) =>
    [...registered.values()].filter((script) => !ids || ids.includes(script.id));

  const api: FakeScriptingApi = {
    registerContentScripts: async (scripts) => {
      const duplicate = scripts.find((script) => registered.has(script.id));
      if (duplicate) throw new Error(`Duplicate script ID '${duplicate.id}'`);
      for (const script of scripts) registered.set(script.id, structuredClone(script));
    },
    updateContentScripts: async (scripts) => {
      requireKnown(scripts.map((script) => script.id));
      for (const script of scripts) {
        registered.set(script.id, { ...registered.get(script.id), ...structuredClone(script) });
      }
    },
    unregisterContentScripts: async (filter) => {
      if (filter?.ids) requireKnown(filter.ids);
      for (const script of select(filter?.ids)) registered.delete(script.id);
    },
    getRegisteredContentScripts: async (filter) => structuredClone(select(filter?.ids)),
    executeScript: async ({ target, files }) => {
      const failure = failures.get(target.tabId);
      if (failure) throw new Error(failure);
      injections.push({ tabId: target.tabId, ...(files && { files }) });
      return [{ frameId: 0, result: undefined }];
    },
  };

  return {
    api,
    get registered() {
      return [...registered.values()];
    },
    injections,
    failInjection: (tabId, message) => void failures.set(tabId, message),
  };
}
