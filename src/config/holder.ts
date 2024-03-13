import {
  Agent,
  ConsoleLogger,
  LogLevel,
  InitConfig,
  HttpOutboundTransport,
  WsOutboundTransport,
} from "@aries-framework/core";
import { HttpInboundTransport, agentDependencies } from "@aries-framework/node";

import { getAgentModules } from "../utils/getAgentModules";
import { importDid } from "../utils/importDid";

export const initializeHolderAgent = async (port: number) => {
  const config: InitConfig = {
    label: "jimezesinachi-holder-agent-0",
    logger: new ConsoleLogger(LogLevel.info),
    walletConfig: {
      id: "jim-ezesinachi-holder-agent-wallet-id-0",
      key: "jim-ezesinachi-holder-agent-test-key-0000000000000000000000000",
    },
    connectionImageUrl: "https://picsum.photos/200",
    autoUpdateStorageOnStartup: true,
  };

  const agent = new Agent({
    config,
    modules: getAgentModules(),
    dependencies: agentDependencies,
  });

  agent.registerOutboundTransport(new HttpOutboundTransport());

  agent.registerOutboundTransport(new WsOutboundTransport());

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

  console.log("Importing holder DID...");
  const holderDid = await importDid({
    agent,
    seed: "abcdabcdabcdabcdabcdabcdabcdabcd",
    did: "JzX62Lx14LqNony52LhQ13",
  });

  return { agent, holderDid } as const;
};
