// src/lib/clients/openrouter.client.ts

import type { OpenRouterRequest, OpenRouterResponse } from "@/lib/types/openrouter.types";
import { OpenRouterError } from "@/lib/utils/openrouter-errors";

export interface HttpClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

export class OpenRouterHttpClient {
  constructor(private readonly config: HttpClientConfig) {}

  async post(endpoint: string, body: OpenRouterRequest): Promise<OpenRouterResponse> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "HTTP-Referer": "https://10x-bloom-learning.app", // Zmień na swoją domenę
          "X-Title": "10x Bloom Learning", // Nazwa aplikacji
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseBody = await this.parseResponseBody(response);

      if (!response.ok) {
        throw OpenRouterError.fromHttpError(response.status, responseBody);
      }

      return responseBody as OpenRouterResponse;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof OpenRouterError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new OpenRouterError("TIMEOUT", `Request timeout after ${this.config.timeout}ms`, 408);
      }

      throw OpenRouterError.networkError(error);
    }
  }

  private async parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        return await response.json();
      } catch (error) {
        const text = await response.text();
        throw OpenRouterError.parseError(error, text);
      }
    }

    const text = await response.text();
    throw OpenRouterError.parseError(new Error("Expected JSON response"), text);
  }
}
