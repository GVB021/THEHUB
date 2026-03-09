import { memoryLocation } from "wouter/memory-location";
import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";
import mitt from "mitt";

const splitFull = (full: string): [string, string] => {
  const idx = full.indexOf("?");
  if (idx === -1) return [full || "/", ""];
  return [full.slice(0, idx) || "/", full.slice(idx + 1)];
};

const initialFull = window.location.pathname + window.location.search;
const [initialPath, initialSearch] = splitFull(initialFull);

const { hook: _baseHook, navigate: _baseNavigate } = memoryLocation({ path: initialPath });

let _search = initialSearch;
const searchEmitter = mitt<{ change: string }>();

export const memoryNavigate = (to: string, opts?: any) => {
  const [path, search] = splitFull(to);
  _search = search;
  searchEmitter.emit("change", search);
  _baseNavigate(path, opts);
};

const subscribeSearch = (cb: () => void) => {
  searchEmitter.on("change", cb);
  return () => searchEmitter.off("change", cb);
};

export const memoryHook = (): [string, typeof memoryNavigate] => {
  const [path] = _baseHook();
  return [path, memoryNavigate];
};

export const memorySearchHook = (): string => {
  useSyncExternalStore(subscribeSearch, () => _search);
  return _search;
};
