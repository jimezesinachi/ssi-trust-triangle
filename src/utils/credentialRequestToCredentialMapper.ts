import { DidKey, DidsApi } from "@credo-ts/core";
import {
  OpenId4VciCredentialFormatProfile,
  OpenId4VciCredentialRequestToCredentialMapper,
} from "@credo-ts/openid4vc";
import { CredentialType } from "../constants/credentialTypes";

export const credentialRequestToCredentialMapper: OpenId4VciCredentialRequestToCredentialMapper =
  async ({
    agentContext,
    credentialsSupported,
    holderBinding,
    issuanceSession,
  }) => {
    const firstSupported = credentialsSupported[0];

    if (firstSupported.format !== OpenId4VciCredentialFormatProfile.SdJwtVc) {
      throw new Error("Issuer agent - Only vc+sd-jwt is supported!");
    }

    if (
      !Object.values(CredentialType).includes(
        firstSupported.vct as CredentialType
      )
    ) {
      throw new Error(
        `Issuer agent - Only ${Object.values(CredentialType)} are supported!`
      );
    }

    issuanceSession.metadata;

    // Find the first did:key did in our wallet. You can modify this based on your needs
    const didsApi = agentContext.dependencyManager.resolve(DidsApi);
    const [didKeyDidRecord] = await didsApi.getCreatedDids({
      method: "key",
    });

    const didKey = DidKey.fromDid(didKeyDidRecord.did);
    const didUrl = `${didKey.did}#${didKey.key.fingerprint}`;

    if (firstSupported.id === undefined) {
      throw new Error("firstSupported.id is undefined!");
    }

    return {
      credentialSupportedId: firstSupported.id,
      format: "vc+sd-jwt",
      holder: holderBinding,
      payload: {
        vct: firstSupported.vct,
        firstName: issuanceSession.issuanceMetadata?.firstName ?? "John",
        lastName: issuanceSession.issuanceMetadata?.lastName ?? "Doe",
        age: issuanceSession.issuanceMetadata?.age ?? 30,
      },
      disclosureFrame: {
        _sd: ["age"],
      },
      issuer: {
        method: "did",
        didUrl,
      },
    };
  };
