import { withRetry } from "./retry.js";
import type { BackendClientConfig, BackendMatch, BackendTeam, BackendTournament } from "./types.js";

export const initBackedClient = (logger: any): BackendClient => {
  const BACKEND_URL = process.env.BACKEND_URL ?? "";
  if (!BACKEND_URL) {
    logger.failed("batch", "BACKEND_URL not configured", null);
    throw new Error("BACKEND_URL not configured");
  }
  return new BackendClient({ baseUrl: BACKEND_URL });
};


export class BackendClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = "BackendClientError";
  }
}

export class BackendClient {
  private readonly baseUrl: string;
  private readonly retryOptions: BackendClientConfig["retryOptions"];

  constructor(config: BackendClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.retryOptions = config.retryOptions ?? {};
  }

  private async request<T = void>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    return withRetry(async () => {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: body != null
          ? { "Content-Type": "application/json" }
          : undefined,
        body: body != null ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new BackendClientError(
          `Backend returned ${response.status} for ${method} ${path}: ${text}`,
          response.status,
          text
        );
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json() as Promise<T>;
    }, this.retryOptions);
  }

  async getFinishedMatches(): Promise<BackendMatch[]> {
    return this.request<BackendMatch[]>("GET", "/matches?status=finished");
  }

  async processMatch(matchId: string, detail: Record<string, unknown>): Promise<void> {
    return this.request("POST", `/matches/${matchId}/process`, detail);
  }

  async getTournamentInstances(
    tournamentId: string
  ): Promise<Array<{ id: string; name: string; tournament_id: string; state: string }>> {
    return this.request("GET", `/tournaments/${tournamentId}/instances`);
  }

  async calculateInstanceRanking(
    instanceId: string
  ): Promise<{
    instance_id: string;
    rank: number;
    total_points: number;
    exact_hits: number;
    outcome_hits: number;
  }> {
    return this.request("POST", `/instances/${instanceId}/calculate-ranking`);
  }

  async calculateTournamentInstanceRanking(
    instanceId: string,
    detail: Record<string, unknown>
  ): Promise<void> {
    return this.request(
      "POST",
      `/tournament-instance/${instanceId}/calculate-tournament-instance-ranking`,
      detail
    );
  }

  async notifyUsers(detail: Record<string, unknown>): Promise<void> {
    return this.request("POST", "/notifications", detail);
  }

  async createTournament(detail: BackendTournament): Promise<BackendTournament> {
    const tournament = {
      "name": detail.name,
      "startDate": detail.startDate,
      "endDate": detail.endDate,
      "matchType": "SingleMatchPerRound"
    };
    return this.request("PUT", "/tournament/create-tournament", tournament);
  }


  async createMatch(detail: BackendMatch): Promise<BackendMatch> {
    const match = {
      "homeTeamId": detail.home_team_id,
      "awayTeamId": detail.away_team_id,
      "tournamentId": detail.tournament_id,
      "kickOff": detail.kick_off,
      "stage": detail.stage,
      "venue": detail.venue
    };
    return this.request("PUT", "/match/create-match", match);
  }

  async createTeam(detail: BackendTeam): Promise<BackendTeam> {
    const team = {
      "name": detail.name,
      "code": detail.code,
      "shieldUrl": detail.shieldUrl
    };
    return this.request("PUT", "/team/create-team", team);
  }
}
