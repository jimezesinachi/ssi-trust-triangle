import { ConnectionsModule } from "@credo-ts/core";
import {
  OpenId4VcHolderModule,
  OpenId4VcIssuerModule,
  OpenId4VcVerifierModule,
} from "@credo-ts/openid4vc";
import { AskarModule } from "@credo-ts/askar";
import { ariesAskar } from "@hyperledger/aries-askar-nodejs";
import { Router } from "express";

import { credentialRequestToCredentialMapper } from "./credentialRequestToCredentialMapper";

export const getIssuerAgentModules = (
  port: number,
  issuerRouter: Router,
  verifierRouter: Router
) => {
  return {
    askar: new AskarModule({
      ariesAskar,
    }),

    // askar: new AskarModule({ askar, store: { id: name, key: name } }),
    // kms: new Kms.KeyManagementModule({
    //   backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
    // }),

    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),

    openId4VcIssuer: new OpenId4VcIssuerModule({
      baseUrl: `http://localhost:${port}/oid4vci`,
      router: issuerRouter,
      endpoints: {
        credential: {
          credentialRequestToCredentialMapper,
        },
      },
    }),

    openId4VcVerifier: new OpenId4VcVerifierModule({
      baseUrl: `http://localhost:${port}/siop`,
      router: verifierRouter,
    }),
  } as const;
};

export const getHolderAgentModules = () => {
  return {
    askar: new AskarModule({
      ariesAskar,
    }),

    // askar: new AskarModule({ askar, store: { id: name, key: name } }),
    // kms: new Kms.KeyManagementModule({
    //   backends: [new NodeKeyManagementService(new NodeInMemoryKeyManagementStorage())],
    // }),

    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),

    openId4VcHolderModule: new OpenId4VcHolderModule(),
  } as const;
};

type AgentModules = {
  connections: ConnectionsModule;
  openId4VcIssuer?: OpenId4VcIssuerModule;
  openId4VcVerifier?: OpenId4VcVerifierModule;
  openId4VcHolderModule?: OpenId4VcHolderModule;
};

export const getAgentModules = (): AgentModules => {
  return {
    connections: new ConnectionsModule({
      autoAcceptConnections: true,
    }),

    openId4VcIssuer: new OpenId4VcIssuerModule({
      baseUrl: `http://localhost:3000/oid4vci`,
      router: Router(),
      endpoints: {
        credential: {
          credentialRequestToCredentialMapper,
        },
      },
    }),

    openId4VcVerifier: new OpenId4VcVerifierModule({
      baseUrl: `http://localhost:3000/siop`,
      router: Router(),
    }),

    openId4VcHolderModule: new OpenId4VcHolderModule(),
  } as const;
};
