import { initializeHolderAgent } from "../config/holder";
import { initializeIssuerAgent } from "../config/issuer";

export const initialize = async ({
  serverPort,
  issuerPort,
  holderPort,
  issuerRouter,
  verifierRouter,
}: {
  serverPort: number;
  issuerPort: number;
  holderPort: number;
  issuerRouter: any;
  verifierRouter: any;
}) => {
  console.log("Initializing issuer agent...");
  const issuer = await initializeIssuerAgent(issuerPort, serverPort, {
    issuerRouter: issuerRouter,
    verifierRouter: verifierRouter,
  });

  console.log("Initializing holder agent...");
  const holder = await initializeHolderAgent(holderPort);

  return { issuer, holder } as const;
};
