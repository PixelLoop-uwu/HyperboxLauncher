export type ResourceProgress = {
  statusText: string;
  percentage: number;
  totalBytes?: number;
  transferredBytes?: number;
  etaSeconds?: number;
  speedKbps?: number;
}

export type gameLog = {
  type: "info" | "error" | "critical",
  message: string,
  timestamp: number
}