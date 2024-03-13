import {
  ConnectionsModule,
  CredentialsModule,
  ProofsModule,
  DidsModule,
  AutoAcceptCredential,
  V2CredentialProtocol,
  AutoAcceptProof,
  V2ProofProtocol,
} from "@aries-framework/core";
import { AskarModule } from "@aries-framework/askar";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";
import {
  AnonCredsCredentialFormatService,
  AnonCredsModule,
  AnonCredsProofFormatService,
  LegacyIndyCredentialFormatService,
  LegacyIndyProofFormatService,
  V1CredentialProtocol,
  V1ProofProtocol,
} from "@aries-framework/anoncreds";
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from "@aries-framework/indy-vdr";
import { anoncreds } from "@hyperledger/anoncreds-nodejs";
import { AnonCredsRsModule } from "@aries-framework/anoncreds-rs";
import { indyVdr } from "@hyperledger/indy-vdr-nodejs";
import { indyNetworkConfig } from "../constants/bcovrin";

export const getAgentModules = () => {
  return {
    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),

    credentials: new CredentialsModule({
      autoAcceptCredentials: AutoAcceptCredential.ContentApproved,
      credentialProtocols: [
        new V1CredentialProtocol({
          indyCredentialFormat: new LegacyIndyCredentialFormatService(),
        }),
        new V2CredentialProtocol({
          credentialFormats: [
            new LegacyIndyCredentialFormatService(),
            new AnonCredsCredentialFormatService(),
          ],
        }),
      ],
    }),

    proofs: new ProofsModule({
      autoAcceptProofs: AutoAcceptProof.ContentApproved,
      proofProtocols: [
        new V1ProofProtocol({
          indyProofFormat: new LegacyIndyProofFormatService(),
        }),
        new V2ProofProtocol({
          proofFormats: [
            new LegacyIndyProofFormatService(),
            new AnonCredsProofFormatService(),
          ],
        }),
      ],
    }),

    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
    }),

    anoncredsRs: new AnonCredsRsModule({
      anoncreds,
    }),

    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: [indyNetworkConfig],
    }),

    dids: new DidsModule({
      resolvers: [new IndyVdrIndyDidResolver()],
      registrars: [new IndyVdrIndyDidRegistrar()],
    }),

    askar: new AskarModule({
      ariesAskar,
    }),
  } as const;
};
