import { z } from "zod";

const SchemaName = z.string().min(1).max(75);
const CredentialDefinitionId = z.string().min(1);
const HolderName = z.string().min(1).max(100).optional();

export const RegisterSchemaAndCredentialDefinitionInputValidator = z.object({
  schemaName: SchemaName,
});

export const IssueCredentialInputValidator = z.object({
  credentialDefinitionId: CredentialDefinitionId,
  holderName: HolderName,
});

export const RequestProofInputValidator = z.object({
  credentialDefinitionId: CredentialDefinitionId,
});
