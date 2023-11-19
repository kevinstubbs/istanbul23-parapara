import fs from "fs";
import ora from "ora";
import dotenv from "dotenv";
import readline from "readline";
import { optimismGoerli } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  http,
  createWalletClient,
  createPublicClient,
  parseTransaction,
  getContractAddress,
} from "viem";
dotenv.config();

const TestUSDC = JSON.parse(
  fs.readFileSync("./out/TestUSDC.sol/TestUSDC.json", "utf-8")
);
const ParaController = JSON.parse(
  fs.readFileSync("./out/ParaController.sol/ParaController.json", "utf-8")
);

let validConfig = true;
if (process.env.RPC_URL === undefined) {
  console.log("Missing RPC_URL");
  validConfig = false;
}
if (process.env.PRIVATE_KEY === undefined) {
  console.log("Missing PRIVATE_KEY");
  validConfig = false;
}
if (!validConfig) process.exit(1);

const wallet = createWalletClient({
  transport: http(process.env.RPC_URL),
  account: privateKeyToAccount(process.env.PRIVATE_KEY),
});
const client = createPublicClient({ transport: http(process.env.RPC_URL) });

const ask = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (input) => {
      resolve(input);
      rl.close();
    });
  });
};

async function main() {
  const paraControllerAddress = await ask("ParaController address");
  const fundTargeting = await ask("Fund targeting");
  const fundName = await ask("Fund name");

  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      address: paraControllerAddress,
      abi: ParaController.abi,
      chain: optimismGoerli,
      functionName: "createReliefFund",
      account: privateKeyToAccount(process.env.PRIVATE_KEY),
      args: [fundTargeting, 25000000000000000000, 10, fundName],
    }),
  });

  await fetch(
    `https://istanbul23-parapara.vercel.app/api/notify?title=New+Fund&body=A+new+fund+has+been+created+in+${fundTargeting}+called+${encodeURIComponent(
      fundName
    )}`
  );
}

main(...process.argv.splice(2)).then(() => process.exit(0));
