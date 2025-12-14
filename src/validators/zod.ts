import { z } from "zod";
import { CredentialType } from "../constants/credentialTypes";

export const IssueCredentialInputValidator = z.object({
  type: z.nativeEnum(CredentialType),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  age: z.number().min(0).max(999),
});

export const RequestProofInputValidator = z.object({
  type: z.nativeEnum(CredentialType),
  credentialRecordId: z.string().uuid(),
});
