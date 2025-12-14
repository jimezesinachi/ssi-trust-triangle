import {
  SdJwtVcRecord,
  W3cCredentialRecord,
  DidKey,
  getJwkFromKey,
  KeyDidCreateOptions,
} from "@credo-ts/core";
import {
  OpenId4VciCredentialFormatProfile,
  OpenId4VcIssuanceSessionStateChangedEvent,
  OpenId4VcIssuerEvents,
} from "@credo-ts/openid4vc";

import { HolderAgentType, IssuerAgentType } from "../config/base";
import { CredentialType } from "../constants/credentialTypes";

const issueCredential = async ({
  agent,
  issuerId,
  credentialType,
  firstName,
  lastName,
  age,
}: {
  agent: IssuerAgentType;
  issuerId: string;
  credentialType: CredentialType;
  firstName: string;
  lastName: string;
  age: number;
}) => {
  const { credentialOffer, issuanceSession } =
    await agent.modules.openId4VcIssuer.createCredentialOffer({
      issuerId,
      // Values must match the `id` of the credential supported by the issuer
      offeredCredentials: [credentialType],

      // Only pre-authorized code flow is supported
      preAuthorizedCodeFlowConfig: {
        userPinRequired: false,
      },

      issuanceMetadata: {
        firstName: firstName,
        lastName: lastName,
        age: age,
      },
    });

  // Listen and react to changes in the issuance session
  agent.events.on<OpenId4VcIssuanceSessionStateChangedEvent>(
    OpenId4VcIssuerEvents.IssuanceSessionStateChanged,
    async ({ payload }) => {
      if (payload.issuanceSession.id === issuanceSession.id) {
        console.log(
          "Issuer agent - Issuance session state changed to: ",
          payload.issuanceSession.state
        );
      }
    }
  );

  return { credentialOffer, issuanceSession } as const;
};

const resolveCredentialOffer = async (
  agent: HolderAgentType,
  credentialOfferOrIssuanceSessionUri: string
) => {
  console.log("Holder agent - Credential offer received!");

  // Resolved credential offer contains the offer, metadata, etc..
  const resolvedCredentialOffer =
    await agent.modules.openId4VcHolderModule.resolveCredentialOffer(
      credentialOfferOrIssuanceSessionUri
    );

  console.log(
    "Holder agent - Resolved credential offer: ",
    JSON.stringify(resolvedCredentialOffer.credentialOfferPayload, null, 2)
  );

  // Issuer only supports pre-authorized flow for now
  const credentials =
    await agent.modules.openId4VcHolderModule.acceptCredentialOfferUsingPreAuthorizedCode(
      resolvedCredentialOffer,
      {
        credentialBindingResolver: async ({
          supportedDidMethods,
          keyType,
          supportsAllDidMethods,
          supportsJwk,
          credentialFormat,
        }) => {
          if (
            supportsAllDidMethods ||
            supportedDidMethods?.includes("did:key")
          ) {
            const didResult = await agent.dids.create<KeyDidCreateOptions>({
              method: "key",
              options: {
                keyType,
              },
            });

            if (didResult.didState.state !== "finished") {
              throw new Error("Holder agent - DID creation failed!");
            }

            const didKey = DidKey.fromDid(didResult.didState.did);

            return {
              method: "did",
              didUrl: `${didKey.did}#${didKey.key.fingerprint}`,
            };
          }

          if (
            supportsJwk &&
            credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc
          ) {
            const key = await agent.wallet.createKey({
              keyType,
            });

            return {
              method: "jwk",
              jwk: getJwkFromKey(key),
            };
          }

          throw new Error("Holder agent - Unable to create a key binding!");
        },
      }
    );

  console.log(
    "Holder agent - Received credentials",
    JSON.stringify(credentials, null, 2)
  );

  // Store the received credentials
  const records: Array<
    W3cCredentialRecord | SdJwtVcRecord
    // | MdocRecord
  > = [];

  for (const credential of credentials) {
    if ("compact" in credential) {
      const record = await agent.sdJwtVc.store(credential.compact);
      records.push(record);
    }
    // else if ("issuerSignedDocument" in credential) {
    //   const record = await agent.mdoc.store(credential);
    //   records.push(record);
    // }
    else {
      const record = await agent.w3cCredentials.storeCredential({
        credential,
      });
      records.push(record);
    }
  }

  return { records } as const;
};

export const issue = async ({
  issuer,
  holder,
  issuerId,
  credentialType,
  firstName,
  lastName,
  age,
}: {
  issuer: IssuerAgentType;
  holder: HolderAgentType;
  issuerId: string;
  credentialType: CredentialType;
  firstName: string;
  lastName: string;
  age: number;
}) => {
  console.log("Issuer agent - Creating credential offer as issuer...");
  const issuerIssuanceSessionRecord = await issueCredential({
    agent: issuer,
    issuerId,
    credentialType,
    firstName,
    lastName,
    age,
  });

  console.log(
    "Issuer agent - Credential offer:",
    JSON.stringify(issuerIssuanceSessionRecord, null, 2)
  );

  const holderCredentialRecords = await resolveCredentialOffer(
    holder,
    issuerIssuanceSessionRecord.credentialOffer
  );

  return {
    issuerIssuanceSessionRecord,
    holderCredentialRecords,
  } as const;
};
