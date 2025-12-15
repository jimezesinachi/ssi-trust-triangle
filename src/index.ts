import "dotenv/config";
import express, { Router, Request, Response } from "express";

import { initialize } from "./services/initialize";
import { connect } from "./services/connect";
import { issue } from "./services/issue";
import { verify } from "./services/verify";
import {
  IssueCredentialInputValidator,
  RequestProofInputValidator,
} from "./validators/zod";

const app = express();

const port = Number(process.env.SERVER_PORT);
const issuerPort = Number(process.env.ISSUER_INBOUND_TRANSPORT_PORT);
const holderPort = Number(process.env.HOLDER_INBOUND_TRANSPORT_PORT);

app.listen(port, async () => {
  const issuerRouter = async (req: Request, res: Response) => {
    console.log("Issuer agent - Starting issuance flow...");

    const parseResult = IssueCredentialInputValidator.safeParse(req.body);

    if (parseResult.success) {
      const { data: input } = parseResult;

      const issuanceResult = await issue({
        issuer: issuer.agent,
        credentialType: input.type,
        firstName: input.firstName,
        lastName: input.lastName,
        age: input.age,
        issuerId:
          input.type === "AcmeCorpEmployee"
            ? issuer.openid4vcEmployeeIssuer.issuerId
            : input.type === "AcmeCorpResident"
            ? issuer.openid4vcResidentIssuer.issuerId
            : "",
        holder: holder.agent,
      });

      return res.status(200).json({
        message: "Credential issued successfully!",
        data: issuanceResult,
      });
    } else
      return res.status(400).json({
        messsage: "Bad Request! Invalid input received!",
        data: parseResult.error.format(),
      });
  };

  const verifierRouter = async (req: Request, res: Response) => {
    console.log("Verifier agent - Starting verification flow...");

    const parseResult = RequestProofInputValidator.safeParse(req.body);

    if (parseResult.success) {
      const { data: input } = parseResult;

      const selectedCredential = await holder.agent.sdJwtVc.getById(
        input.credentialRecordId
      );

      if (!selectedCredential) {
        return res.status(400).json({
          messsage:
            "Bad Request! Could not find the credential for the supplied ID!",
          data: input,
        });
      }

      const verificationResult = await verify({
        issuer: issuer.agent,
        holder: holder.agent,
        credentialType: input.type,
        credentialId: input.credentialRecordId,
        verifierId: issuer.openId4VcVerifier.verifierId,
        verifierDidKey: issuer.verifierDidKey,
      });

      if (verificationResult.presenterAuthorizationResponse instanceof Error) {
        return res.status(400).json({
          messsage: "Bad Request! Invalid input received!",
          data: verificationResult.presenterAuthorizationResponse.message,
        });
      }

      return res.status(200).json({
        message: "Credential verified successfully!",
        data: verificationResult,
      });
    } else
      return res.status(400).json({
        messsage: "Bad Request! Invalid input received!",
        data: parseResult.error.format(),
      });
  };

  const ir = Router();
  const vr = Router();

  app.use("/oid4vci", ir);
  app.use("/siop", vr);

  const { issuer, holder } = await initialize({
    serverPort: port,
    issuerPort,
    holderPort,
    issuerRouter: ir,
    verifierRouter: vr,
  });

  const { requesterOutOfBandRecord, responderOutOfBandRecord } = await connect({
    issuer: issuer.agent,
    holder: holder.agent,
    port: issuerPort,
  });

  const issuerConnections = await issuer.agent.connections.findAllByOutOfBandId(
    requesterOutOfBandRecord.id
  );
  const issuerConnection = issuerConnections[0];

  const holderConnections = await holder.agent.connections.findAllByOutOfBandId(
    responderOutOfBandRecord.id
  );
  const holderConnection = holderConnections[0];

  app.use(express.json());

  app.get("/connection-status", async (req, res) => {
    if (issuerConnection && holderConnection) {
      return res.status(200).send({
        status: "connected",
        message: "Agent-to-agent connection is up!",
      });
    } else
      return res.status(500).send({
        status: "disconnected",
        mesaage:
          "Agent-to-agent connection is down! Please check server and restart!",
      });
  });

  app.get("/credentials", async (req, res) => {
    const credentials = await holder.agent.sdJwtVc.getAll();

    return res.status(200).send({
      message: "Fetched all credentials successfully!",
      length: credentials.length,
      data: credentials,
    });
  });

  app.post("/issue-credential", issuerRouter);
  app.post("/verify-credential", verifierRouter);

  app.get("/", (req, res) => {
    return res.status(200).send({
      message: "Welcome to Jim Ezesinachi's SSI trust triangle demo app!",
      data: [],
    });
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    res.status(500).send("Internal server error!");
  });

  console.log(`SSI trust triangle demo app listening on port ${port}!`);
});
