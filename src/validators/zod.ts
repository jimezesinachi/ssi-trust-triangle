import { z } from "zod";

const CredentialDefinitionId = z.string().min(1);
const HolderName = z.string().min(1).max(100).optional();

export const IssueCredentialInputSchema = z.object({
  credentialDefinitionId: CredentialDefinitionId,
  holderName: HolderName,
});

export const RequestProofInputSchema = z.object({
  credentialDefinitionId: CredentialDefinitionId,
});
