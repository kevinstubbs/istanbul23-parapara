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

async function main() {
  // const usdc20Hash = await wallet.deployContract({
  //   abi: TestUSDC.abi,
  //   chain: optimismGoerli,
  //   args: ["fakeUSDC", "FFF"],
  //   bytecode: TestUSDC.bytecode.object,
  // });

  // // Getting the contract address this way didn't work, but it was deployed to
  // // 0x2d985715f3fc5ebc643dccd12e99dccf470f52b2
  // // https://goerli-optimism.etherscan.io/address/0x2d985715f3fc5ebc643dccd12e99dccf470f52b2
  // const transaction = parseTransaction(usdc20Hash);
  // const usdc20Address = getContractAddress({
  //   from: wallet.account.address,
  //   nonce: transaction.nonce,
  // });
  // console.log(transaction.nonce, usdc20Address);

  const usdc20Address = "0x2d985715f3fc5ebc643dccd12e99dccf470f52b2";

  await client.waitForTransactionReceipt({
    hash: await wallet.writeContract({
      address: usdc20Address,
      abi: TestUSDC.abi,
      chain: optimismGoerli,
      functionName: "mint",
      account: privateKeyToAccount(process.env.PRIVATE_KEY),
      args: [wallet.account.address, 1000000000000000000000],
    }),
  });
}

main(...process.argv.splice(2)).then(() => process.exit(0));
