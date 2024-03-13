import {
  Agent,
  InitConfig,
  ConsoleLogger,
  LogLevel,
  HttpOutboundTransport,
  WsOutboundTransport,
} from "@aries-framework/core";
import { agentDependencies, HttpInboundTransport } from "@aries-framework/node";

import { getAgentModules } from "../utils/getAgentModules";
import { importDid } from "../utils/importDid";

export const initializeIssuerAgent = async (port: number) => {
  const config: InitConfig = {
    label: "jimezesinachi-issuer-agent-0",
    logger: new ConsoleLogger(LogLevel.info),
    walletConfig: {
      id: "jim-ezesinachi-issuer-agent-wallet-id-0",
      key: "jim-ezesinachi-issuer-agent-test-key-0000000000000000000000000",
    },
    endpoints: [`http://localhost:${port}`],
    connectionImageUrl: "https://picsum.photos/200",
    autoUpdateStorageOnStartup: true,
  };

  const agent = new Agent({
    config,
    modules: getAgentModules(),
    dependencies: agentDependencies,
  });

  agent.registerOutboundTransport(new WsOutboundTransport());

  agent.registerOutboundTransport(new HttpOutboundTransport());

  agent.registerInboundTransport(new HttpInboundTransport({ port }));

  await agent
    .initialize()
    .then(() => {
      console.log("Agent initialized!");
    })
    .catch((e) => {
      console.error(
        `Something went wrong while setting up the agent! Error: ${e}`
      );
    });

  await agent.credentials.offerCredential({
    protocolVersion: "v2",
    connectionId: "",
    credentialFormats: {
      anoncreds: {
        credentialDefinitionId: "",
        attributes: [{ name: "name", value: "Jim Ezesinachi" }],
      },
    },
  });

  console.log("Importing issuer DID...");
  const issuerDid = await importDid({
    agent,
    seed: "testtesttesttesttesttesttesttest",
    did: "q7ATwTYbQDgiigVijUAej",
  });

  return { agent, issuerDid } as const;
};
