import { ethers } from "ethers";
import { SafeAccountConfig, SafeFactory } from "@safe-global/protocol-kit";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const RPC_URL = "https://eth-sepolia.public.blastapi.io";
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Initialize signers
  const owner1Signer = new ethers.Wallet(
    process.env.OWNER_1_PRIVATE_KEY!,
    provider
  );
  const owner2Signer = new ethers.Wallet(
    process.env.OWNER_2_PRIVATE_KEY!,
    provider
  );
  const owner3Signer = new ethers.Wallet(
    process.env.OWNER_3_PRIVATE_KEY!,
    provider
  );

  console.log("STAGE 1: init");

  const safeFactory = await SafeFactory.init({
    provider: RPC_URL,
    signer: process.env.OWNER_1_PRIVATE_KEY,
  });

  // Deploy a safe
  const safeAccountConfig: SafeAccountConfig = {
    owners: [
      await owner1Signer.getAddress(),
      await owner2Signer.getAddress(),
      await owner3Signer.getAddress(),
    ],
    threshold: 2,
  };

  console.log("STAGE 2: about to deploy safe");

  /* This Safe is tied to owner 1 because the factory was initialized with
  an adapter that had owner 1 as the signer. */
  const protocolKitOwner = await safeFactory.deploySafe({ safeAccountConfig });

  console.log("STAGE 3: deployed safe");

  const safeAddress = await protocolKitOwner.getAddress();

  console.log("Your Safe has been deployed:");
  console.log(`https://sepolia.etherscan.io/address/${safeAddress}`);
  console.log(`https://app.safe.global/sep:${safeAddress}`);

  const safeAmount = ethers.parseUnits("0.06", "ether").toString();

  const transactionParameters = {
    to: safeAddress,
    value: safeAmount,
  };

  console.log("STAGE 4: Raise funds");

  const tx = await owner1Signer.sendTransaction(transactionParameters);

  console.log("Fundraising...");
  console.log(
    `Deposit Transaction: https://sepolia.etherscan.io/tx/${tx.hash}`
  );
}

main();
