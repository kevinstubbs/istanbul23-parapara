import "dotenv/config";
import { PushAPI } from "@pushprotocol/restapi";
import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_URL);
  const signer = new ethers.Wallet(
    process.env.PRIVATE_KEY_ORGANIZER!,
    provider
  );

  const userAlice = await PushAPI.initialize(signer, { env: "staging" as any });
  const { title, body } = req.query;

  try {
    const apiResponse = await userAlice.channel.send(["*"], {
      notification: {
        title: title as string,
        body: body as string,
      },
    });

    res.status(apiResponse.status);
    res.send("");
  } catch (e) {
    console.error(e);
    res.status(500).send("Something went wrong.");
  }
};
