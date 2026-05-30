import { withRetry } from "./retry.js";
import type { BackendClientConfig, BackendMatch } from "./types.js";

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
  private cachedToken: string | null = null;
  private tokenExpiration: number = 0;

  constructor(config: BackendClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.retryOptions = config.retryOptions ?? {};
  }

    // Nuevo método: Obtiene y cachea el token de Cognito
  private async getM2MToken(): Promise<string> {
    // Si el token existe y aún le queda más de 1 minuto de vida, lo reutilizamos
    if (this.cachedToken && Date.now() < this.tokenExpiration) {
      return this.cachedToken;
    }

    const clientId = process.env.COGNITO_CLIENT_ID;
    const clientSecret = process.env.COGNITO_CLIENT_SECRET;
    const domain = process.env.COGNITO_DOMAIN;

    if (!clientId || !clientSecret || !domain) {
      throw new Error("Faltan las variables de entorno para Cognito M2M (CLIENT_ID, CLIENT_SECRET o DOMAIN)");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'data-backend/read');

    const response = await fetch(`${domain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Fallo al obtener el token M2M de Cognito: ${errorText}`);
    }

    const data = await response.json() as { access_token: string, expires_in: number };
    
    this.cachedToken = data.access_token;
    // expires_in viene en segundos. Lo pasamos a milisegundos y restamos 60 seg de margen de seguridad
    this.tokenExpiration = Date.now() + (data.expires_in * 1000) - 60000;

    return this.cachedToken;
  }

private async request<T = void>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    return withRetry(async () => {
      // 1. Pedimos el token (usará el cacheado si es válido)
      const token = await this.getM2MToken();

      // 2. Preparamos los headers inyectando la Autorización
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`
      };

      if (body != null) {
        headers["Content-Type"] = "application/json";
      }

      // 3. Hacemos la petición al backend con el token incluido
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,  
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
}
