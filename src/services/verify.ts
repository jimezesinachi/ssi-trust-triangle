import {
  ProofEventTypes,
  ProofExchangeRecord,
  ProofState,
  ProofStateChangedEvent,
} from "@aries-framework/core";
import { AgentType } from "../config/base";

const sendProofRequest = async ({
  agent,
  connectionId,
  credentialDefinitionId,
}: {
  agent: AgentType;
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

  const requesterProofExchangeRecord = await agent.proofs.requestProof({
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

  return { requesterProofExchangeRecord } as const;
};

const setupPresenterProofListener = async (agent: AgentType) => {
  console.log("Waiting for requester to send proof request...");

  const getProofExchangeRecord = () =>
    new Promise<ProofExchangeRecord>((resolve, reject) => {
      // Timeout of 30 seconds
      const timeoutId = setTimeout(
        () => reject(new Error("Missing proof exchange record!")),
        30000
      );

      // Start listener
      agent.events.on<ProofStateChangedEvent>(
        ProofEventTypes.ProofStateChanged,
        async ({ payload }) => {
          switch (payload.proofRecord.state) {
            case ProofState.RequestReceived:
              console.log("Proof request received!");

              const requestedCredentials =
                await agent.proofs.selectCredentialsForRequest({
                  proofRecordId: payload.proofRecord.id,
                });

              await agent.proofs.acceptRequest({
                proofRecordId: payload.proofRecord.id,
                proofFormats: requestedCredentials.proofFormats,
              });

              break;
            case ProofState.Done:
              console.log(
                `Proof presentation for proof id ${payload.proofRecord.id} has been accepted by its requester, and the exchange is completed!`
              );

              clearTimeout(timeoutId);
              resolve(payload.proofRecord);
          }
        }
      );
    });

  const presenterProofExchangeRecord = await getProofExchangeRecord();

  return { presenterProofExchangeRecord } as const;
};

export const verify = async ({
  issuer,
  holder,
  connectionId,
  credentialDefinitionId,
}: {
  issuer: AgentType;
  holder: AgentType;
  connectionId: string;
  credentialDefinitionId: string;
}) => {
  console.log("Listening for proof state changes as presenter...");
  const presenterProofExchangeListenerPromise =
    setupPresenterProofListener(holder);

  console.log("Sending proof request as requester...");
  const requesterProofExchangeRecord = await sendProofRequest({
    agent: issuer,
    connectionId,
    credentialDefinitionId,
  });

  const presenterProofExchangeRecord =
    await presenterProofExchangeListenerPromise;

  return {
    requesterProofExchangeRecord,
    presenterProofExchangeRecord,
  } as const;
};
