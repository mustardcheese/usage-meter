export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Snapshot = {
  contextTokens?: number
  contextWindow: number
  contextPercent?: number
  limits: Limit[]
  // Bumped by the minute tick so the "resets in" countdown redraws.
  at: number
}

declare module 'claude-code' {
  interface PluginState {
    'usage-meter': { snapshot: Snapshot }
  }
}
