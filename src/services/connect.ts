import {
  ConnectionEventTypes,
  ConnectionRecord,
  ConnectionStateChangedEvent,
  OutOfBandRecord,
} from "@aries-framework/core";
import { AgentType } from "../config/base";

const createNewInvitation = async ({
  agent,
  port,
}: {
  agent: AgentType;
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
  agent: AgentType;
  port: number;
}) => {
  const { invitation } = await agent.oob.createLegacyInvitation();

  return invitation.toUrl({ domain: `http://localhost:${port}` });
};

const receiveInvitation = async (agent: AgentType, invitationUrl: string) => {
  const { outOfBandRecord } = await agent.oob.receiveInvitationFromUrl(
    invitationUrl
  );

  return outOfBandRecord;
};

const setupRequesterConnectionListener = async (
  agent: AgentType,
  outOfBandRecord: OutOfBandRecord
) => {
  console.log("Waiting for holder to accept connection request...");

  const getConnectionRecord = (outOfBandId: string) =>
    new Promise<ConnectionRecord>((resolve, reject) => {
      // Timeout of 30 seconds
      const timeoutId = setTimeout(
        () => reject(new Error("Missing connection record!")),
        30000
      );

      // Start listener
      agent.events.on<ConnectionStateChangedEvent>(
        ConnectionEventTypes.ConnectionStateChanged,
        ({ payload }) => {
          if (payload.connectionRecord.outOfBandId !== outOfBandId) return;

          clearTimeout(timeoutId);
          resolve(payload.connectionRecord);
        }
      );

      // Also retrieve the connection record by invitation if the event has already fired
      void agent.connections
        .findAllByOutOfBandId(outOfBandId)
        .then(([connectionRecord]) => {
          if (connectionRecord) {
            clearTimeout(timeoutId);
            resolve(connectionRecord);
          }
        });
    });

  const requesterConnectionRecord = await getConnectionRecord(
    outOfBandRecord.id
  );

  try {
    await agent.connections.returnWhenIsConnected(requesterConnectionRecord.id);
  } catch (e) {
    console.log("Attempt to establish connection failed!");
    return;
  }

  console.log(
    `Connection for out-of-band id ${outOfBandRecord.id} is completed!`
  );
  console.log(
    "Connection between requester and responder is established successfully!"
  );
};

export const connect = async ({
  issuer,
  holder,
  port,
}: {
  issuer: AgentType;
  holder: AgentType;
  port: number;
}) => {
  console.log("Creating the invitation as requester...");
  const { outOfBandRecord: requesterOutOfBandRecord, invitationUrl } =
    await createNewInvitation({
      agent: issuer,
      port,
    });

  console.log("Listening for connection state changes as requester...");
  const requesterConnectionListenerPromise = setupRequesterConnectionListener(
    issuer,
    requesterOutOfBandRecord
  );

  console.log("Accepting the invitation as responder...");
  const responderOutOfBandRecord = await receiveInvitation(
    holder,
    invitationUrl
  );

  await requesterConnectionListenerPromise;

  return { requesterOutOfBandRecord, responderOutOfBandRecord } as const;
};
