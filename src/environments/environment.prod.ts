import { appConfig } from "src/config/config";

export const environment = {
  production: true,
  apiBaseUrl: `${appConfig.baseUrl}`,
  websocketUrl: `${appConfig.baseUrl}/wss`
};
