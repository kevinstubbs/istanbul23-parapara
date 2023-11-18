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

  const worldIDAddress = await fetch(
    "https://developer.worldcoin.org/api/v1/contracts"
  )
    .then((res) => res.json())
    .then(
      // (res) => res.find(({ key }) => key == "staging.semaphore.wld.eth").value
      (res) => res.find(({ key }) => key == "op-goerli.id.worldcoin.eth").value
    );

  // if you need any extra constructor parameters, add them to this array in order
  const inputs = [
    process.env.WLD_APP_ID ?? (await ask("App ID: ")),
    process.env.WLD_ACTION_ID ?? (await ask("Action: ")),
  ];

  const spinner = ora(`Deploying your contract (ParaController)...`).start();

  const hash = await wallet.deployContract({
    abi: ParaController.abi,
    chain: optimismGoerli,
    args: [worldIDAddress, ...inputs, usdc20Address],
    bytecode: ParaController.bytecode.object,
  });

  spinner.text = `Waiting for deploy transaction (tx: ${hash})`;
  const tx = await client.waitForTransactionReceipt({ hash });

  spinner.succeed(
    `Deployed your contract (ParaController) to ${tx.contractAddress}`
  );
}

main(...process.argv.splice(2)).then(() => process.exit(0));
