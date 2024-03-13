import {
  Agent,
  CredentialEventTypes,
  CredentialState,
  CredentialStateChangedEvent,
} from "@aries-framework/core";

const issueCredential = async ({
  agent,
  connectionId,
  credentialDefinitionId,
  holderName,
}: {
  agent: Agent<any>;
  connectionId: string;
  credentialDefinitionId: string;
  holderName: string | undefined;
}) => {
  const credentialExchangeRecord = await agent.credentials.offerCredential({
    protocolVersion: "v2",
    connectionId,
    credentialFormats: {
      anoncreds: {
        credentialDefinitionId,
        attributes: [{ name: "name", value: holderName ?? "Jim Ezesinachi" }],
      },
    },
  });

  return credentialExchangeRecord;
};

const setupCredentialListener = (agent: Agent<any>) => {
  agent.events.on<CredentialStateChangedEvent>(
    CredentialEventTypes.CredentialStateChanged,
    async ({ payload }) => {
      switch (payload.credentialRecord.state) {
        case CredentialState.OfferReceived:
          console.log("Credential offer received!");
          await agent.credentials.acceptOffer({
            credentialRecordId: payload.credentialRecord.id,
          });
        case CredentialState.Done:
          console.log(
            `Credential for credential id ${payload.credentialRecord.id} is accepted!`
          );
      }
    }
  );
};

export const issue = async ({
  issuer,
  holder,
  connectionId,
  credentialDefinitionId,
  holderName,
}: {
  issuer: Agent<any>;
  holder: Agent<any>;
  connectionId: string;
  credentialDefinitionId: string;
  holderName: string | undefined;
}) => {
  console.log("Listening for credential state changes as holder...");
  setupCredentialListener(holder);

  console.log("Issuing credential as issuer...");
  await issueCredential({
    agent: issuer,
    connectionId,
    credentialDefinitionId,
    holderName,
  });
};
