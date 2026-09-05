export const ask = question => () => globalThis.prompt?.(question) ?? "";
