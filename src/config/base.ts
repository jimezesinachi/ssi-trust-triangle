import {
  Agent,
  ConsoleLogger,
  InitConfig,
  LogLevel,
} from "@aries-framework/core";
import { getAgentModules } from "../utils/getAgentModules";
import { agentDependencies } from "@aries-framework/node";

const config: InitConfig = {
  label: "jimezesinachi-agent-0",
  logger: new ConsoleLogger(LogLevel.info),
  walletConfig: {
    id: "jim-ezesinachi-agent-wallet-id-0",
    key: "jim-ezesinachi-agent-test-key-0000000000000000000000000",
  },
  endpoints: ["http://example.org"],
  connectionImageUrl: "https://picsum.photos/200",
  autoUpdateStorageOnStartup: true,
};

const agent = new Agent({
  config,
  modules: getAgentModules(),
  dependencies: agentDependencies,
});

export type AgentType = typeof agent;
