import { KeyType, TypedArrayEncoder } from "@aries-framework/core";
import { AgentType } from "../config/base";

export const importDid = async ({
  agent,
  seed,
  did,
}: {
  agent: AgentType;
  seed: string;
  did: string;
}) => {
  const seedBuffer = TypedArrayEncoder.fromString(seed);

  const indyDid = `did:indy:bcovrin:test:${did}`;

  await agent.dids.import({
    did: indyDid,
    overwrite: true,
    privateKeys: [
      {
        privateKey: seedBuffer,
        keyType: KeyType.Ed25519,
      },
    ],
  });

  return indyDid;
};
