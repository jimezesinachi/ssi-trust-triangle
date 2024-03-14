import "dotenv/config";
import express from "express";
import { initialize } from "./services/initialize";
import { connect } from "./services/connect";
import { register } from "./services/register";
import { issue } from "./services/issue";
import { verify } from "./services/verify";
import {
  RegisterSchemaAndCredentialDefinitionInputValidator,
  IssueCredentialInputValidator,
  RequestProofInputValidator,
} from "./validators/zod";

const app = express();
const port = Number(process.env.SERVER_PORT);
const issuerPort = Number(process.env.ISSUER_INBOUND_TRANSPORT_PORT);
const holderPort = Number(process.env.HOLDER_INBOUND_TRANSPORT_PORT);

app.listen(port, async () => {
  const { issuer, holder } = await initialize({
    issuerPort,
    holderPort,
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

  app.post("/register-schema-and-credential-definition", async (req, res) => {
    const parseResult =
      RegisterSchemaAndCredentialDefinitionInputValidator.safeParse(req.body);

    if (parseResult.success) {
      console.log("Registering...");

      const { data: input } = parseResult;

      const registrationResult = await register({
        issuer: issuer.agent,
        issuerDid: issuer.issuerDid,
        schemaName: input.schemaName,
      });

      return res.status(201).send({
        message: "Registered!",
        data: registrationResult,
      });
    } else
      return res.status(400).send({
        messsage: "Bad Request! Invalid input received!",
        data: parseResult.error.format(),
      });
  });

  app.post("/issue-credential", async (req, res) => {
    const parseResult = IssueCredentialInputValidator.safeParse(req.body);

    if (parseResult.success) {
      console.log("Issuing...");

      const { data: input } = parseResult;

      const issuanceResult = await issue({
        issuer: issuer.agent,
        holder: holder.agent,
        connectionId: issuerConnection.id,
        credentialDefinitionId: input.credentialDefinitionId,
        holderName: input.holderName,
      });

      return res.status(200).send({ message: "Issued!", data: issuanceResult });
    } else
      return res.status(400).send({
        messsage: "Bad Request! Invalid input received!",
        data: parseResult.error.format(),
      });
  });

  app.post("/verify-credential", async (req, res) => {
    const parseResult = RequestProofInputValidator.safeParse(req.body);

    if (parseResult.success) {
      console.log("Verifying...");

      const { data: input } = parseResult;

      const verificationResult = await verify({
        issuer: issuer.agent,
        holder: holder.agent,
        connectionId: issuerConnection.id,
        credentialDefinitionId: input.credentialDefinitionId,
      });

      return res
        .status(200)
        .send({ message: "Verified!", data: verificationResult });
    } else
      return res.status(400).send({
        messsage: "Bad Request! Invalid input received!",
        data: parseResult.error.format(),
      });
  });

  app.get("/", (req, res) => {
    return res.status(200).send({
      message: "Welcome to Jim Ezesinachi's SSI trust triangle demo app!",
    });
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err);
    res.status(500).send("Internal server error!");
  });

  console.log(`SSI trust triangle demo app listening on port ${port}!`);
});
