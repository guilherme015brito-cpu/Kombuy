export type YampiConfig = {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  appUrl: string;
};

const requiredEnvLabels: Record<keyof YampiConfig, string> = {
  clientId: "YAMPI_CLIENT_ID",
  redirectUri: "YAMPI_REDIRECT_URI",
  authUrl: "YAMPI_AUTH_URL",
  tokenUrl: "YAMPI_TOKEN_URL",
  appUrl: "NEXT_PUBLIC_APP_URL"
};

const startEnvKeys: Array<keyof YampiConfig> = ["clientId", "redirectUri", "authUrl", "appUrl"];
const DEFAULT_YAMPI_AUTH_URL = "https://auth.yampi.com.br/oauth/authorize";
const DEFAULT_YAMPI_TOKEN_URL = "https://auth.yampi.com.br/oauth/token";

function cleanUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function getYampiConfig() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ? cleanUrl(process.env.NEXT_PUBLIC_APP_URL) : "";

  const config: YampiConfig = {
    clientId: process.env.YAMPI_CLIENT_ID || "",
    redirectUri: process.env.YAMPI_REDIRECT_URI || "",
    authUrl: process.env.YAMPI_AUTH_URL || DEFAULT_YAMPI_AUTH_URL,
    tokenUrl: process.env.YAMPI_TOKEN_URL || DEFAULT_YAMPI_TOKEN_URL,
    appUrl
  };

  const missing = (Object.keys(requiredEnvLabels) as Array<keyof YampiConfig>)
    .filter((key) => !config[key])
    .map((key) => requiredEnvLabels[key]);

  return {
    config,
    missing,
    isConfigured: missing.length === 0
  };
}

export function buildYampiAuthUrl(state: string, codeChallenge: string) {
  const { config } = getYampiConfig();
  const missing = startEnvKeys
    .filter((key) => !config[key])
    .map((key) => requiredEnvLabels[key]);

  if (missing.length > 0) {
    return {
      url: null,
      missing
    };
  }

  const url = new URL(config.authUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return {
    url: url.toString(),
    missing: []
  };
}

export function getYampiMissingEnvMessage(missing: string[]) {
  return `Configure ${missing.join(", ")} para conectar a Yampi.`;
}
