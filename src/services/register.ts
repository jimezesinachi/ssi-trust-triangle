import crypto from "node:crypto";
import { AgentType } from "../config/base";
import { RegisterSchemaReturn } from "@aries-framework/anoncreds";

const registerSchema = async ({
  agent,
  indyDid,
  schemaName,
}: {
  agent: AgentType;
  indyDid: string;
  schemaName: string | undefined;
}) => {
  const schemaResult = await agent.modules.anoncreds.registerSchema({
    schema: {
      attrNames: ["name"],
      issuerId: indyDid,
      name:
        `${schemaName} - ${crypto.randomUUID()}` ??
        `Jim Ezesinachi Example Schema - ${crypto.randomUUID()}`,
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
  agent: AgentType;
  indyDid: string;
  schemaResult: RegisterSchemaReturn;
}) => {
  if (!schemaResult.schemaState.schemaId) {
    throw new Error(
      `Error creating credential definition: No schema id passed`
    );
  }

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

export const register = async ({
  issuer,
  issuerDid,
  schemaName,
}: {
  issuer: AgentType;
  issuerDid: string;
  schemaName: string | undefined;
}) => {
  console.log("Registering a schema as issuer...");
  const schemaResult = await registerSchema({
    agent: issuer,
    indyDid: issuerDid,
    schemaName,
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
