import {
  Agent,
  ConnectionEventTypes,
  ConnectionStateChangedEvent,
  DidExchangeState,
  OutOfBandRecord,
} from "@aries-framework/core";

const createNewInvitation = async ({
  agent,
  port,
}: {
  agent: Agent<any>;
  port: number;
}) => {
  const outOfBandRecord = await agent.oob.createInvitation();

  return {
    invitationUrl: outOfBandRecord.outOfBandInvitation.toUrl({
      domain: `http://localhost:${port}`,
    }),
    outOfBandRecord,
  };
};

const createLegacyInvitation = async ({
  agent,
  port,
}: {
  agent: Agent<any>;
  port: number;
}) => {
  const { invitation } = await agent.oob.createLegacyInvitation();

  return invitation.toUrl({ domain: `http://localhost:${port}` });
};

const receiveInvitation = async (agent: Agent<any>, invitationUrl: string) => {
  const { outOfBandRecord } = await agent.oob.receiveInvitationFromUrl(
    invitationUrl
  );

  return outOfBandRecord;
};

const setupConnectionListener = (
  agent: Agent<any>,
  outOfBandRecord: OutOfBandRecord,
  cb: (...args: any) => void
) => {
  agent.events.on<ConnectionStateChangedEvent>(
    ConnectionEventTypes.ConnectionStateChanged,
    async ({ payload }) => {
      if (payload.connectionRecord.outOfBandId !== outOfBandRecord.id) return;
      if (payload.connectionRecord.state === DidExchangeState.Completed) {
        console.log(
          `Connection for out-of-band id ${outOfBandRecord.id} completed`
        );

        cb();
      }
    }
  );
};

export const connect = async ({
  issuer,
  holder,
  port,
}: {
  issuer: Agent<any>;
  holder: Agent<any>;
  port: number;
}) => {
  console.log("Creating the invitation as issuer...");
  const { outOfBandRecord: issuerOutOfBandRecord, invitationUrl } =
    await createNewInvitation({
      agent: issuer,
      port,
    });

  console.log("Listening for connection state changes as issuer...");
  setupConnectionListener(issuer, issuerOutOfBandRecord, () =>
    console.log(
      "Connection between issuer and holder is established successfully!"
    )
  );

  console.log("Accepting the invitation as holder...");
  const holderOutOfBandRecord = await receiveInvitation(holder, invitationUrl);

  return { issuerOutOfBandRecord, holderOutOfBandRecord } as const;
};
