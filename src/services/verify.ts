import {
  Agent,
  ProofEventTypes,
  ProofState,
  ProofStateChangedEvent,
} from "@aries-framework/core";

const sendProofRequest = async ({
  agent,
  connectionId,
  credentialDefinitionId,
}: {
  agent: Agent<any>;
  connectionId: string;
  credentialDefinitionId: string;
}) => {
  const proofAttribute = {
    name: {
      name: "name",
      restrictions: [
        {
          cred_def_id: credentialDefinitionId,
        },
      ],
    },
  };

  const proofExchangeRecord = await agent.proofs.requestProof({
    protocolVersion: "v2",
    connectionId,
    proofFormats: {
      anoncreds: {
        name: "proof-request",
        version: "1.0",
        requested_attributes: proofAttribute,
      },
    },
  });

  return proofExchangeRecord;
};

const setupProofListener = (agent: Agent<any>) => {
  agent.events.on<ProofStateChangedEvent>(
    ProofEventTypes.ProofStateChanged,
    async ({ payload }) => {
      switch (payload.proofRecord.state) {
        case ProofState.RequestReceived:
          console.log("Proof offer received!");

          const requestedCredentials =
            await agent.proofs.selectCredentialsForRequest({
              proofRecordId: payload.proofRecord.id,
            });

          await agent.proofs.acceptRequest({
            proofRecordId: payload.proofRecord.id,
            proofFormats: requestedCredentials.proofFormats,
          });
        case ProofState.Done:
          console.log(
            `Proof for proof id ${payload.proofRecord.id} is accepted!`
          );
      }
    }
  );
};

export const verify = async ({
  issuer,
  holder,
  connectionId,
  credentialDefinitionId,
}: {
  issuer: Agent<any>;
  holder: Agent<any>;
  connectionId: string;
  credentialDefinitionId: string;
}) => {
  console.log("Listening for proof state changes as holder...");
  setupProofListener(holder);

  console.log("Sending proof request as issuer...");
  await sendProofRequest({
    agent: issuer,
    connectionId,
    credentialDefinitionId,
  });
};
