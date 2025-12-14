import {
  Agent,
  ConsoleLogger,
  HttpOutboundTransport,
  InitConfig,
  KeyDidCreateOptions,
  KeyType,
  JwaSignatureAlgorithm,
  LogLevel,
  DidKey,
} from "@credo-ts/core";
import { agentDependencies, HttpInboundTransport } from "@credo-ts/node";
import { Router } from "express";

import { getIssuerAgentModules } from "../utils/getAgentModules";
import { CredentialType } from "../constants/credentialTypes";

export const initializeIssuerAgent = async (
  port: number,
  serverPort: number,
  {
    issuerRouter,
    verifierRouter,
  }: { issuerRouter: Router; verifierRouter: Router }
) => {
  const config: InitConfig = {
    label: "jimezesinachi-issuer-agent-0",
    // allowInsecureHttpUrls: true,
    logger: new ConsoleLogger(LogLevel.error),
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
    dependencies: agentDependencies,
    modules: getIssuerAgentModules(serverPort, issuerRouter, verifierRouter),
  });

  agent.registerInboundTransport(new HttpInboundTransport({ port }));
  agent.registerOutboundTransport(new HttpOutboundTransport());

  await agent
    .initialize()
    .then(() => {
      console.log("Issuer agent = Agent initialized!");
    })
    .catch((e) => {
      console.error(
        `Something went wrong while setting up the issuer agent! Error: ${e}`
      );
    });

  console.log("Creating issuer with supported credentials...");
  // Create an issuer with supported credential: AcmeCorpEmployee
  const openid4vcEmployeeIssuer =
    await agent.modules.openId4VcIssuer.createIssuer({
      display: [
        {
          name: "ACME Corp.",
          description:
            "ACME Corp. is a company that provides the best services.",
          text_color: "#000000",
          background_color: "#FFFFFF",
          logo: {
            url: "https://acme.com/logo.png",
            alt_text: "ACME Corp. logo",
          },
        },
      ],
      credentialsSupported: [
        {
          format: "vc+sd-jwt",
          vct: CredentialType.AcmeCorpEmployee,
          id: CredentialType.AcmeCorpEmployee,
          cryptographic_binding_methods_supported: ["did:key"],
          cryptographic_suites_supported: [JwaSignatureAlgorithm.ES256],
        },
      ],
    });

  // Create an issuer with supported credential: AcmeCorpResident
  const openid4vcResidentIssuer =
    await agent.modules.openId4VcIssuer.createIssuer({
      display: [
        {
          name: "ACME Corp.",
          description:
            "ACME Corp. is a company that provides the best services.",
          text_color: "#000000",
          background_color: "#FFFFFF",
          logo: {
            url: "https://acme.com/logo.png",
            alt_text: "ACME Corp. logo",
          },
        },
      ],
      credentialsSupported: [
        {
          format: "vc+sd-jwt",
          vct: CredentialType.AcmeCorpResident,
          id: CredentialType.AcmeCorpResident,
          cryptographic_binding_methods_supported: ["did:key"],
          cryptographic_suites_supported: [JwaSignatureAlgorithm.ES256],
        },
      ],
    });

  console.log("Creating issuer DID...");
  // Create a did:key that we will use for issuance
  const issuerDidResult = await agent.dids.create<KeyDidCreateOptions>({
    method: "key",
    options: {
      keyType: KeyType.Ed25519,
    },
  });

  if (issuerDidResult.didState.state !== "finished") {
    throw new Error("Issuer DID creation failed!");
  }

  console.log("Creating verifier...");
  // Create a verifier
  const openId4VcVerifier =
    await agent.modules.openId4VcVerifier.createVerifier({});

  console.log("Creating verifier DID...");
  // Create a did:key that we will use for signing OpenID4VP authorization requests
  const verifierDidResult = await agent.dids.create<KeyDidCreateOptions>({
    method: "key",
    options: {
      keyType: KeyType.Ed25519,
    },
  });

  if (verifierDidResult.didState.state !== "finished") {
    throw new Error("Verifier DID creation failed!");
  }

  const verifierDidKey = DidKey.fromDid(verifierDidResult.didState.did);

  return {
    agent,
    issuerDidResult,
    openid4vcEmployeeIssuer,
    openid4vcResidentIssuer,
    verifierDidResult,
    openId4VcVerifier,
    verifierDidKey,
  } as const;
};
