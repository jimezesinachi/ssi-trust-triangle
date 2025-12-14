import {
  OpenId4VcIssuanceSessionState,
  OpenId4VcIssuanceSessionStateChangedEvent,
  OpenId4VcIssuerEvents,
  OpenId4VcVerificationSessionRecord,
  OpenId4VcVerificationSessionState,
  OpenId4VcVerificationSessionStateChangedEvent,
  OpenId4VcVerifierEvents,
} from "@credo-ts/openid4vc";
import { HolderAgentType } from "../config/base";
import { OpenId4VcIssuanceSessionRecord } from "@credo-ts/openid4vc/build/openid4vc-issuer/repository";

const setupHolderIssuanceListener = async (agent: HolderAgentType) => {
  console.log("Holder agent - Waiting for issuer to send credential offer...");

  const getOpenId4VcIssuanceSessionRecord = () =>
    new Promise<OpenId4VcIssuanceSessionRecord>((resolve, reject) => {
      // Timeout of 30 seconds
      const timeoutId = setTimeout(
        () =>
          reject(new Error("Holder agent - No credential offer was received!")),
        30000
      );

      // Start listener
      agent.events.on<OpenId4VcIssuanceSessionStateChangedEvent>(
        OpenId4VcIssuerEvents.IssuanceSessionStateChanged,
        async ({ payload }) => {
          console.log(
            `Holder agent - Issuance session ${payload.issuanceSession.id} state changed to: `,
            payload.issuanceSession.state
          );

          if (
            payload.issuanceSession.state ===
            OpenId4VcIssuanceSessionState.Completed
          ) {
            console.log(
              `Holder agent - Successfully completed issuance session ${payload.issuanceSession.id}: `,
              JSON.stringify(
                payload.issuanceSession.credentialOfferPayload,
                null,
                2
              )
            );
          }

          clearTimeout(timeoutId);
          resolve(payload.issuanceSession);
        }
      );
    });

  const holderOpenId4VcIssuanceSessionRecord =
    await getOpenId4VcIssuanceSessionRecord();

  return {
    holderOpenId4VcIssuanceSessionRecord,
  } as const;
};

const setupPresenterVerificationListener = async (agent: HolderAgentType) => {
  console.log(
    "Presenter agent - Waiting for requester to send verification request..."
  );

  const getOpenId4VcVerificationSessionRecord = () =>
    new Promise<OpenId4VcVerificationSessionRecord>((resolve, reject) => {
      // Timeout of 30 seconds
      const timeoutId = setTimeout(
        () =>
          reject(
            new Error("Presenter agent - No verification request was received!")
          ),
        30000
      );

      // Start listener
      agent.events.on<OpenId4VcVerificationSessionStateChangedEvent>(
        OpenId4VcVerifierEvents.VerificationSessionStateChanged,
        async ({ payload }) => {
          console.log(
            `Presenter agent - Verification session ${payload.verificationSession.id} state changed to: `,
            payload.verificationSession.state
          );

          if (
            payload.verificationSession.state ===
            OpenId4VcVerificationSessionState.ResponseVerified
          ) {
            console.log(
              `Presenter agent - Successfully completed verification session ${payload.verificationSession.id}: `,
              JSON.stringify(
                payload.verificationSession.authorizationResponsePayload,
                null,
                2
              )
            );
          }

          clearTimeout(timeoutId);
          resolve(payload.verificationSession);
        }
      );
    });

  const presenterOpenId4VcVerificationSessionRecord =
    await getOpenId4VcVerificationSessionRecord();

  return {
    presenterOpenId4VcVerificationSessionRecord,
  } as const;
};
