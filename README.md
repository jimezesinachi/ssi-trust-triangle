# SSI Trust Triangle

This is a demo app showing the basic tenet of self-sovereign identity: a "cryptographic trust" -based communication session between three parties: a credential issuer, a credential holder, and a credential verifier.

The `issuer` issues a cryprographically secure credential to the `holder`, which in turn can use their credential to prove some `attribute` of theirs contained in their credential to any `verifier` requesting such, thus forming a trust triangle.

In this implementation, the issuer also serves as the verifier, to keep the agent setup code minimal.

Tech stack used:

- [Node.js](https://nodejs.org/) JavaScript runtime.

- [Express](https://expressjs.com/) web server package.

- The OpenWallet Foundation [credo-ts](https://github.com/openwallet-foundation/credo-ts) SSI framework (formerly under Hyperledger as Aries Framework JavaScript), and its extension packages.

## Run instructions

1. Clone this repository.

2. Install the [Classic Yarn](https://classic.yarnpkg.com/) JavaScript package manager globally on your machine (if you don't already have it installed). Also install [Node.js](https://nodejs.org/) `version 18 LTS`, or switch to it if you're using a version switcher.

   **NOTE:** It is important you use `version 18 LTS`, as it is the highest LTS version compatible with the SSI framework packages.

3. Open a terminal window/tab in the root of your cloned repository directory, then run the command: `yarn` to install the needed packages.

4. Create a `.env` file by copying the `.env.example` file in this repository. On Unix-based systems, the following command should work:

   ```sh
       cp .env.example .env
   ```

   **NOTE:** You should edit the .env file to any port numbers of your choice.

5. Run the `yarn dev` command to start the server and setup the agent-to-agent connection.

## Usage instructions

The server exposes a RESTful API which can be used to trigger actions and communication between the agents.

The base endpoint (when testing locally) is of the format: <http://localhost:PORT>, where `PORT` is the `SERVER_PORT` as defined in your `.env` file.

### Server health

This is a basic endpoint to check that the server is up, and that it can receive requests.

Endpoint: `/`

Method: `GET`

### Agent-to-agent connection

During startup, the server attempts to setup the agent-to-agent connection. This endpoint allows you to check the status of the connection.

Endpoint: `/connection-status`

Method: `GET`

### Register a schema and credential definition

Register a schema and a corresponding credential definition to the DID network registry. This endpoint takes a JSON body.

Endpoint: `/register-schema-and-credential-definition`

Method: `POST`

Body:

```json
{
  "schemaName": "Name for the created schema"
}
```

### Issue a credential

Trigger a credential issuance offer from the issuer agent to the holder agent. This endpoint takes a JSON body.

Endpoint: `/issue-credential`

Method: `POST`

Body:

```json
{
  "credentialDefinitionId": "Credential definition id (as returned from the schema and credential definition registration endpoint's response)",
  "holderName": "Preferred name of the holder of the issued credential"
}
```

### Verify a credential

Trigger a proof presentation request from the issuer agent to the holder agent. This endpoint takes a JSON body.

Endpoint: `/verify-credential`

Method: `POST`

Body:

```json
{
  "credentialDefinitionId": "Credential definition id (as returned from the registration endpoint response)"
}
```

## Issues and bug reports

For any contributions and/or bug reports, feel free to open an issue on the `Issues` page of this repository.
