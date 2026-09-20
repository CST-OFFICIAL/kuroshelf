declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: any) => void;
        prompt?: string;
      }

      interface TokenResponse {
        access_token: string;
        expires_in: number;
        hd?: string;
        prompt: string;
        token_type: string;
        scope: string;
        state?: string;
        error?: string;
        error_description?: string;
        error_uri?: string;
      }

      interface OverridableTokenClientConfig {
        prompt?: string;
        scope?: string;
      }

      interface TokenClient {
        requestAccessToken(config?: OverridableTokenClientConfig): void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
      function hasGrantedAllScopes(tokenResponse: TokenResponse, firstScope: string, ...restScopes: string[]): boolean;
      function hasGrantedAnyScope(tokenResponse: TokenResponse, firstScope: string, ...restScopes: string[]): boolean;
      function revoke(accessToken: string, done?: () => void): void;
    }
  }
}
