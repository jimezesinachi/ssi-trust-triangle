import { Agent } from "@aries-framework/core";
import crypto from "node:crypto";

const registerSchema = async ({
  agent,
  indyDid,
}: {
  agent: Agent<any>;
  indyDid: string;
}) => {
  const schemaResult = await agent.modules.anoncreds.registerSchema({
    schema: {
      attrNames: ["name"],
      issuerId: indyDid,
      name: `Jim Ezesinachi Example Schema - ${crypto.randomUUID()}`,
      version: "1.0.0",
    },
    options: {},
  });

  if (schemaResult.schemaState.state === "failed") {
    throw new Error(
      `Error creating schema: ${schemaResult.schemaState.reason}`
    );
  } else {
    return schemaResult;
  }
};

const registerCredentialDefinition = async ({
  agent,
  indyDid,
  schemaResult,
}: {
  agent: Agent<any>;
  indyDid: string;
  schemaResult: any;
}) => {
  const credentialDefinitionResult =
    await agent.modules.anoncreds.registerCredentialDefinition({
      credentialDefinition: {
        tag: "default",
        issuerId: indyDid,
        schemaId: schemaResult.schemaState.schemaId,
      },
      options: {},
    });

  if (credentialDefinitionResult.credentialDefinitionState.state === "failed") {
    throw new Error(
      `Error creating credential definition: ${credentialDefinitionResult.credentialDefinitionState.reason}`
    );
  } else {
    return credentialDefinitionResult;
  }
};

export const define = async ({
  issuer,
  issuerDid,
}: {
  issuer: Agent<any>;
  issuerDid: string;
}) => {
  console.log("Registering a schema as issuer...");
  const schemaResult = await registerSchema({
    agent: issuer,
    indyDid: issuerDid,
  });

  console.log("Registering a credential definition as issuer...");
  const credentialDefinitionResult = await registerCredentialDefinition({
    agent: issuer,
    indyDid: issuerDid,
    schemaResult,
  });

  return {
    credentialDefinitionResult,
  } as const;
};
