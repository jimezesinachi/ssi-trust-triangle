import {
  Agent,
  ConsoleLogger,
  HttpOutboundTransport,
  InitConfig,
  KeyDidCreateOptions,
  KeyType,
  LogLevel,
} from "@credo-ts/core";
import { agentDependencies, HttpInboundTransport } from "@credo-ts/node";

import { getHolderAgentModules } from "../utils/getAgentModules";

export const initializeHolderAgent = async (port: number) => {
  const config: InitConfig = {
    label: "jimezesinachi-holder-agent-0",
    logger: new ConsoleLogger(LogLevel.error),
    walletConfig: {
      id: "jim-ezesinachi-holder-agent-wallet-id-0",
      key: "jim-ezesinachi-holder-agent-test-key-0000000000000000000000000",
    },
    endpoints: [`http://localhost:${port}`],
    connectionImageUrl: "https://picsum.photos/200",
    autoUpdateStorageOnStartup: true,
  };

  const agent = new Agent({
    config,
    modules: getHolderAgentModules(),
    dependencies: agentDependencies,
  });

  agent.registerInboundTransport(new HttpInboundTransport({ port }));
  agent.registerOutboundTransport(new HttpOutboundTransport());

  await agent
    .initialize()
    .then(() => {
      console.log("Holder agent - Agent initialized!");
    })
    .catch((e) => {
      console.error(
        `Something went wrong while setting up the holder agent! Error: ${e}`
      );
    });

  console.log("Creating holder DID...");

  // Create a did:key that we will use for issuance
  const holderDidResult = await agent.dids.create<KeyDidCreateOptions>({
    method: "key",
    options: {
      keyType: KeyType.Ed25519,
    },
  });

  if (holderDidResult.didState.state !== "finished") {
    throw new Error("Holder DID creation failed!");
  }

  return { agent, holderDid: holderDidResult } as const;
};
