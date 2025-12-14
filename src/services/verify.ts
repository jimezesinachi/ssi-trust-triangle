import { DidKey, DifPexInputDescriptorToCredentials } from "@credo-ts/core";
import { HolderAgentType, IssuerAgentType } from "../config/base";
import {
  OpenId4VcVerificationSessionState,
  OpenId4VcVerificationSessionStateChangedEvent,
  OpenId4VcVerifierEvents,
} from "@credo-ts/openid4vc";

import { CredentialType } from "../constants/credentialTypes";

const sendProofRequest = async ({
  agent,
  credentialType,
  verifierId,
  verifierDidKey,
}: {
  agent: IssuerAgentType;
  credentialType: CredentialType;
  verifierId: string;
  verifierDidKey: DidKey;
}) => {
  const { authorizationRequest, verificationSession } =
    await agent.modules.openId4VcVerifier.createAuthorizationRequest({
      verifierId,
      requestSigner: {
        didUrl: `${verifierDidKey.did}#${verifierDidKey.key.fingerprint}`,
        method: "did",
      },
      // Add DIF presentation exchange data
      presentationExchange: {
        definition: {
          id: "9ed05140-b33b-445e-a0f0-9a23aa501868",
          name: `${credentialType} Verification`,
          purpose: `We need to verify your ${credentialType} status to grant access to the ${credentialType} portal`,
          input_descriptors: [
            {
              id: "9c98fb43-6fd5-49b1-8dcc-69bd2a378f23",
              constraints: {
                // Require limit disclosure
                limit_disclosure: "required",
                fields: [
                  {
                    filter: {
                      type: "string",
                      const: credentialType,
                    },
                    path: ["$.vct"],
                  },
                ],
              },
            },
          ],
        },
      },
    });

  // Listen and react to changes in the verification session
  agent.events.on<OpenId4VcVerificationSessionStateChangedEvent>(
    OpenId4VcVerifierEvents.VerificationSessionStateChanged,
    async ({ payload }) => {
      if (payload.verificationSession.id === verificationSession.id) {
        console.log(
          "Verifier agent - Verification session state changed to: ",
          payload.verificationSession.state
        );
      }

      if (
        payload.verificationSession.state ===
        OpenId4VcVerificationSessionState.ResponseVerified
      ) {
        const verifiedAuthorizationResponse =
          await agent.modules.openId4VcVerifier.getVerifiedAuthorizationResponse(
            verificationSession.id
          );

        console.log(
          "Verifier agent - Successfully verified presentation: ",
          JSON.stringify(
            verifiedAuthorizationResponse.presentationExchange?.presentations,
            null,
            2
          ),
          ""
        );
      }
    }
  );

  return {
    authorizationRequest,
    verificationSession,
  } as const;
};

const resolveSiopAuthorizationRequest = async (
  agent: HolderAgentType,
  credentialId: string,
  proofOfferOrVerificationSessionUri: string
) => {
  console.log("Presenter agent - Verification request received!");

  try {
    // Resolved credential offer contains the offer, metadata, etc..
    const resolvedAuthorizationRequest =
      await agent.modules.openId4VcHolderModule.resolveSiopAuthorizationRequest(
        proofOfferOrVerificationSessionUri
      );

    if (!resolvedAuthorizationRequest.presentationExchange) {
      return new Error(
        "Presenter agent - No presentation exchange found in request!"
      );
    }

    // Automatically select credentials. In a wallet you could manually choose which credentials
    // to return based on the "resolvedAuthorizationRequest.presentationExchange.credentialsForRequest" value
    // const selectedCredentials =
    //   presentationExchangeService.selectCredentialsForRequest(
    //     resolvedAuthorizationRequest.presentationExchange.credentialsForRequest
    //   );

    // Manually select credential based on the credentialId provided
    const credentialsForRequest =
      resolvedAuthorizationRequest.presentationExchange.credentialsForRequest;

    if (!credentialsForRequest.areRequirementsSatisfied) {
      return new Error(
        "Presenter agent - Could not find the required credentials for the presentation submission!"
      );
    }

    const selectedCredentials: DifPexInputDescriptorToCredentials = {};

    for (const requirement of credentialsForRequest.requirements) {
      // Take needsCount entries from the submission entry
      for (const submission of requirement.submissionEntry.slice(
        0,
        requirement.needsCount
      )) {
        if (!selectedCredentials[submission.inputDescriptorId]) {
          selectedCredentials[submission.inputDescriptorId] = [];
        }

        for (const credential of submission.verifiableCredentials) {
          if (credential.credentialRecord.id === credentialId) {
            selectedCredentials[submission.inputDescriptorId].push(
              credential.credentialRecord
            );
          }
        }
      }
    }

    // If no matching credentials found, return error
    if (Object.keys(selectedCredentials).length === 0) {
      return new Error(
        "Presenter agent - Could not find the required credentials for the presentation submission!"
      );
    }

    // Issuer only supports pre-authorized flow for now
    const authorizationResponse =
      await agent.modules.openId4VcHolderModule.acceptSiopAuthorizationRequest({
        authorizationRequest: resolvedAuthorizationRequest.authorizationRequest,
        presentationExchange: {
          credentials: selectedCredentials,
        },
      });

    return { authorizationResponse } as const;
  } catch (e) {
    return new Error(e);
  }
};

export const verify = async ({
  issuer,
  holder,
  credentialType,
  credentialId,
  verifierId,
  verifierDidKey,
}: {
  issuer: IssuerAgentType;
  holder: HolderAgentType;
  credentialType: CredentialType;
  credentialId: string;
  verifierId: string;
  verifierDidKey: DidKey;
}) => {
  console.log("Verifier agent - Creating verification request as verifier...");
  const verifierVerificationSessionRecord = await sendProofRequest({
    agent: issuer,
    credentialType,
    verifierId,
    verifierDidKey,
  });

  console.log(
    "Verifier agent - Verification request: ",
    JSON.stringify(verifierVerificationSessionRecord, null, 2)
  );

  const presenterAuthorizationResponse = await resolveSiopAuthorizationRequest(
    holder,
    credentialId,
    verifierVerificationSessionRecord.authorizationRequest
  );

  return {
    verifierVerificationSessionRecord,
    presenterAuthorizationResponse,
  } as const;
};
