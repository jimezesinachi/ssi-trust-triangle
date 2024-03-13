import express from "express";
import { initialize } from "./services/initialize";
import { connect } from "./services/connect";
import { define } from "./services/define";
import { issue } from "./services/issue";
import { verify } from "./services/verify";
import {
  IssueCredentialInputSchema,
  RequestProofInputSchema,
} from "./validators/zod";

const app = express();
const port = 3000;
const issuerPort = 3001;
const holderPort = 3002;

app.listen(port, async () => {
  const { issuer, holder } = await initialize({ issuerPort, holderPort });

  await issuer.agent.credentials.offerCredential({
    protocolVersion: "v2",
    connectionId: "",
    credentialFormats: {
      anoncreds: {
        credentialDefinitionId: "",
        attributes: [{ name: "name", value: "Jim Ezesinachi" }],
      },
    },
  });

  const { issuerOutOfBandRecord, holderOutOfBandRecord } = await connect({
    issuer: issuer.agent,
    holder: holder.agent,
    port: issuerPort,
  });

  await issuer.agent.credentials.offerCredential({
    protocolVersion: "v2",
    connectionId: "",
    credentialFormats: {
      anoncreds: {
        credentialDefinitionId: "",
        attributes: [{ name: "name", value: "Jim Ezesinachi" }],
      },
    },
  });

  const issuerConnection = (
    await issuer.agent.connections.findAllByOutOfBandId(
      issuerOutOfBandRecord.id
    )
  )[0];

  const holderConnection = (
    await holder.agent.connections.findAllByOutOfBandId(
      holderOutOfBandRecord.id
    )
  )[0];

  app.use(express.json());

  app.get("/define", async (req, res) => {
    console.log("Defining...");

    const definitionResult = await define({
      issuer: issuer.agent,
      issuerDid: issuer.issuerDid,
    });

    return res.status(201).send({
      message: "Defined!",
      data: definitionResult,
    });
  });

  app.post("/issue", async (req, res) => {
    const parseResult = IssueCredentialInputSchema.safeParse(req.body);

    if (parseResult.success) {
      console.log("Issuing...");

      const { data: input } = parseResult;

      await issuer.agent.credentials.offerCredential({
        protocolVersion: "v2",
        connectionId: "",
        credentialFormats: {
          anoncreds: {
            credentialDefinitionId: "",
            attributes: [{ name: "name", value: "Jim Ezesinachi" }],
          },
        },
      });

      const issuanceResult = await issue({
        issuer: issuer.agent,
        holder: holder.agent,
        connectionId: issuerConnection.id,
        credentialDefinitionId: input.credentialDefinitionId,
        holderName: input.holderName,
      });

      return res.status(201).send({ message: "Issued!", data: issuanceResult });
    } else
      return res.status(400).send({
        messsage: "Bad Request! Invalid input received!",
        data: parseResult.error.format(),
      });
  });

  app.post("/verify", async (req, res) => {
    const parseResult = RequestProofInputSchema.safeParse(req.body);

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
        .status(201)
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
      data: req,
    });
  });

  console.log(`SSI trust triangle demo app listening on port ${port}`);
});
