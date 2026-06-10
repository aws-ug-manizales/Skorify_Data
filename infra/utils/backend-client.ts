import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { withRetry } from "./retry.js";
import type { BackendClientConfig, BackendMatch, CalculateInstanceRankingDetail, MatchFinishedDetail } from "./types.js";

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

interface M2MCredentials {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
  scope: string;
}

interface TokenCache {
  value: string;
  expiresAt: number;
}

const secretsManager = new SecretsManagerClient({});
let cachedCredentials: M2MCredentials | null = null;
let cachedToken: TokenCache | null = null;

export class BackendClient {
  private readonly baseUrl: string;
  private readonly m2mSecretArn: string;
  private readonly retryOptions: BackendClientConfig["retryOptions"];

  constructor(config: BackendClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.m2mSecretArn = config.m2mSecretArn;
    this.retryOptions = config.retryOptions ?? {};
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < cachedToken.expiresAt) return cachedToken.value;

    if (!cachedCredentials) {
      const { SecretString } = await secretsManager.send(
        new GetSecretValueCommand({ SecretId: this.m2mSecretArn }),
      );
      if (!SecretString)
        throw new Error(`M2M secret ${this.m2mSecretArn} returned empty value`);
      cachedCredentials = JSON.parse(SecretString) as M2MCredentials;
    }

    const { clientId, clientSecret, tokenEndpoint, scope } = cachedCredentials;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64",
    );

    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope,
      }).toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token request failed (${res.status}): ${text}`);
    }

    const { access_token, expires_in } = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };

    cachedToken = {
      value: access_token,
      expiresAt: now + (expires_in - 300) * 1000,
    };
    return access_token;
  }

  private async request<T = void>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    return withRetry(async () => {
      const token = await this.getToken();
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body != null ? { "Content-Type": "application/json" } : {}),
        },
        body: body != null ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new BackendClientError(
          `Backend returned ${response.status} for ${method} ${path}: ${text}`,
          response.status,
          text,
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

  async processMatch(
    matchId: string,
    detail: MatchFinishedDetail,
  ): Promise<void> {
    return this.request("POST", `/matches/${matchId}/process`, detail);
  }

  async getTournamentInstances(
    tournamentId: string,
  ): Promise<
    Array<{ id: string; name: string; tournament_id: string; state: string }>
  > {
    return this.request("GET", `/tournaments/${tournamentId}/instances`);
  }

  async calculateInstanceRanking(instanceId: string): Promise<{
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
    detail: CalculateInstanceRankingDetail,
  ): Promise<void> {
    return this.request(
      "POST",
      `/tournament-instance/${instanceId}/calculate-tournament-instance-ranking`,
      detail,
    );
  }

  async notifyUsers(detail: Record<string, unknown>): Promise<void> {
    return this.request("POST", "/notifications", detail);
  }
}
