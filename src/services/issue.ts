import {
  CredentialEventTypes,
  CredentialExchangeRecord,
  CredentialState,
  CredentialStateChangedEvent,
} from "@aries-framework/core";
import { AgentType } from "../config/base";

const issueCredential = async ({
  agent,
  connectionId,
  credentialDefinitionId,
  holderName,
}: {
  agent: AgentType;
  connectionId: string;
  credentialDefinitionId: string;
  holderName: string | undefined;
}) => {
  const issuerCredentialExchangeRecord =
    await agent.credentials.offerCredential({
      protocolVersion: "v2",
      connectionId,
      credentialFormats: {
        anoncreds: {
          credentialDefinitionId,
          attributes: [{ name: "name", value: holderName ?? "Jim Ezesinachi" }],
        },
      },
    });

  return { issuerCredentialExchangeRecord } as const;
};

const setupHolderCredentialExchangeListener = async (agent: AgentType) => {
  console.log("Waiting for issuer to send credential offer...");

  const getCredentialExchangeRecord = () =>
    new Promise<CredentialExchangeRecord>((resolve, reject) => {
      // Timeout of 30 seconds
      const timeoutId = setTimeout(
        () => reject(new Error("Missing credential exchange record!")),
        30000
      );

      // Start listener
      agent.events.on<CredentialStateChangedEvent>(
        CredentialEventTypes.CredentialStateChanged,
        async ({ payload }) => {
          switch (payload.credentialRecord.state) {
            case CredentialState.OfferReceived:
              console.log("Credential offer received!");

              await agent.credentials.acceptOffer({
                credentialRecordId: payload.credentialRecord.id,
              });

              break;
            case CredentialState.Done:
              console.log(
                `Credential for credential id ${payload.credentialRecord.id} has been received, and the exchange is completed!`
              );

              clearTimeout(timeoutId);
              resolve(payload.credentialRecord);
          }
        }
      );
    });

  const holderCredentialExchangeRecord = await getCredentialExchangeRecord();

  return { holderCredentialExchangeRecord } as const;
};

export const issue = async ({
  issuer,
  holder,
  connectionId,
  credentialDefinitionId,
  holderName,
}: {
  issuer: AgentType;
  holder: AgentType;
  connectionId: string;
  credentialDefinitionId: string;
  holderName: string | undefined;
}) => {
  console.log("Listening for credential state changes as holder...");
  const holderCredentialExchangePromise =
    setupHolderCredentialExchangeListener(holder);

  console.log("Issuing credential as issuer...");
  const issuerCredentialExchangeRecord = await issueCredential({
    agent: issuer,
    connectionId,
    credentialDefinitionId,
    holderName,
  });

  const holderCredentialExchangeRecord = await holderCredentialExchangePromise;

  return {
    issuerCredentialExchangeRecord,
    holderCredentialExchangeRecord,
  } as const;
};
