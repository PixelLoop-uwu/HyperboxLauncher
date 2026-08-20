export type ResourceProgress = {
  statusText: string;
  percentage: number;
  totalBytes?: number;
  transferredBytes?: number;
  etaSeconds?: number;
  speedKbps?: number;
}

export type GameLog = {
  type: "info" | "error" | "critical",
  message: string,
  timestamp: number
}