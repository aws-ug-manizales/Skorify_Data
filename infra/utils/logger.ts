import type { EventLogEntry, ProcessingStatus } from "./types.js";

export function createEventLogger(lambdaName: string) {
  return {
    log(
      matchId: string,
      status: ProcessingStatus,
      message: string,
      metadata?: Record<string, unknown>
    ) {
      const entry: EventLogEntry = {
        match_id: matchId,
        status,
        message,
        timestamp: new Date().toISOString(),
      };

      if (metadata) {
        entry.metadata = metadata;
      }

      const prefix = `[${lambdaName}][${status}]`;
      console.log(prefix, JSON.stringify(entry));
    },

    started(matchId: string, message: string, metadata?: Record<string, unknown>) {
      this.log(matchId, "STARTED", message, metadata);
    },

    retrying(
      matchId: string,
      message: string,
      attempt: number,
      metadata?: Record<string, unknown>
    ) {
      const entry: EventLogEntry = {
        match_id: matchId,
        status: "RETRYING",
        message,
        attempt,
        timestamp: new Date().toISOString(),
      };
      if (metadata) entry.metadata = metadata;

      console.log(`[${lambdaName}][RETRYING][attempt=${attempt}]`, JSON.stringify(entry));
    },

    success(matchId: string, message: string, metadata?: Record<string, unknown>) {
      this.log(matchId, "SUCCESS", message, metadata);
    },

    failed(
      matchId: string,
      message: string,
      error: unknown,
      metadata?: Record<string, unknown>
    ) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(matchId, "FAILED", `${message}: ${errorMessage}`, metadata);
    },
  };
}
