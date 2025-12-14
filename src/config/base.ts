import { Agent, ConsoleLogger, InitConfig, LogLevel } from "@credo-ts/core";
import { agentDependencies } from "@credo-ts/node";
import { Router } from "express";

import {
  getIssuerAgentModules,
  getHolderAgentModules,
  getAgentModules,
} from "../utils/getAgentModules";

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

const issuer = new Agent({
  config,
  modules: getIssuerAgentModules(0, Router(), Router()),
  dependencies: agentDependencies,
});

export type IssuerAgentType = typeof issuer;

const holder = new Agent({
  config,
  modules: getHolderAgentModules(),
  dependencies: agentDependencies,
});

export type HolderAgentType = typeof holder;
