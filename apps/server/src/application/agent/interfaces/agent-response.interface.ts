export type AgentToolCallRecord = {
  tool: string;
  input: unknown;
  output: unknown;
  durationMs: number;
  error?: string;
};

export type AgentResponse = {
  answer: string;
  toolCalls: AgentToolCallRecord[];
  proposalIds: string[];
  totalIterations: number;
  finishReason: "end_turn" | "max_iterations" | "error";
};
