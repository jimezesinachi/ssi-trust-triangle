import { initializeHolderAgent } from "../config/holder";
import { initializeIssuerAgent } from "../config/issuer";

export const initialize = async ({
  issuerPort,
  holderPort,
}: {
  issuerPort: number;
  holderPort: number;
}) => {
  console.log("Initializing issuer agent...");
  const issuer = await initializeIssuerAgent(issuerPort);

  await issuer.agent.credentials.offerCredential({
    protocolVersion: "v2",
    connectionId: "",
    credentialFormats: {
      anoncreds: {
        credentialDefinitionId: "",
        attributes: [{ name: "name", value: "Jim Ezesinachi" }],
      },
    },
  });

  console.log("Initializing holder agent...");
  const holder = await initializeHolderAgent(holderPort);

  return { issuer, holder } as const;
};
