import { withRetry, type RetryOptions } from "./retry.js";

export interface BackendClientConfig {
  baseUrl: string;
  retryOptions?: RetryOptions;
}

export interface BackendMatch {
  id: string;
  tournament_id: string;
  home_team_id: string;
  away_team_id: string;
  kick_off: string;
  home_goals: number;
  away_goals: number;
  status: string;
  stage: string;
  venue: string;
}

export class BackendClient {
  private readonly baseUrl: string;
  private readonly retryOptions: RetryOptions;

  constructor(config: BackendClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.retryOptions = config.retryOptions ?? {};
  }

  async getFinishedMatches(): Promise<BackendMatch[]> {
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/matches?status=finished`
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${await response.text()}`
        );
      }

      return response.json() as Promise<BackendMatch[]>;
    }, this.retryOptions);
  }

  async processMatch(matchId: string, detail: Record<string, unknown>): Promise<void> {
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/matches/${matchId}/process`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detail),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${await response.text()}`
        );
      }
    }, this.retryOptions);
  }

  async getTournamentInstances(
    tournamentId: string
  ): Promise<Array<{ id: string; name: string; tournament_id: string; state: string }>> {
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/tournaments/${tournamentId}/instances`
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${await response.text()}`
        );
      }

      return response.json();
    }, this.retryOptions);
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
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/instances/${instanceId}/calculate-ranking`,
        { method: "POST" }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${await response.text()}`
        );
      }

      return response.json();
    }, this.retryOptions);
  }

  async calculateTournamentInstanceRanking(
    instanceId: string,
    detail: Record<string, unknown>
  ): Promise<void> {
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/tournament-instance/${instanceId}/calculate-tournament-instance-ranking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detail),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${await response.text()}`
        );
      }
    }, this.retryOptions);
  }

  async notifyUsers(
    detail: Record<string, unknown>
  ): Promise<void> {
    return withRetry(async () => {
      const response = await fetch(
        `${this.baseUrl}/notifications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(detail),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Backend returned ${response.status}: ${await response.text()}`
        );
      }
    }, this.retryOptions);
  }
}
