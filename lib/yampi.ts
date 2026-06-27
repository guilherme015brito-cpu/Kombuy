export type YampiConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authUrl: string;
  tokenUrl: string;
  appUrl: string;
};

const requiredEnvLabels: Record<keyof YampiConfig, string> = {
  clientId: "YAMPI_CLIENT_ID",
  clientSecret: "YAMPI_CLIENT_SECRET",
  redirectUri: "YAMPI_REDIRECT_URI",
  authUrl: "YAMPI_AUTH_URL",
  tokenUrl: "YAMPI_TOKEN_URL",
  appUrl: "NEXT_PUBLIC_APP_URL"
};

function cleanUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function getYampiConfig() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ? cleanUrl(process.env.NEXT_PUBLIC_APP_URL) : "";
  const redirectUri =
    process.env.YAMPI_REDIRECT_URI ||
    (appUrl ? `${appUrl}/api/yampi/oauth/callback` : "");

  const config: YampiConfig = {
    clientId: process.env.YAMPI_CLIENT_ID || "",
    clientSecret: process.env.YAMPI_CLIENT_SECRET || "",
    redirectUri,
    authUrl: process.env.YAMPI_AUTH_URL || "",
    tokenUrl: process.env.YAMPI_TOKEN_URL || "",
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

export function buildYampiAuthUrl(state: string) {
  const { config, missing } = getYampiConfig();

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

  return {
    url: url.toString(),
    missing: []
  };
}

export function getYampiMissingEnvMessage(missing: string[]) {
  return `Configure ${missing.join(", ")} para conectar a Yampi.`;
}
