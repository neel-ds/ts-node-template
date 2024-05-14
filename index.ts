import { decodeBase58, ethers } from "ethers";
import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
} from "@safe-global/protocol-kit";
import dotenv from "dotenv";
import SafeApiKit from "@safe-global/api-kit";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";

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

  const ethAdapterOwner1 = new EthersAdapter({
    ethers,
    signerOrProvider: owner1Signer,
  });

  // Initialize API kit
  const apiKit = new SafeApiKit({
    chainId: BigInt(11155111),
  });

  console.log("STAGE 1: init");

  const safeFactory = await SafeFactory.create({
    ethAdapter: ethAdapterOwner1,
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
  const protocolKitOwner1 = await safeFactory.deploySafe({ safeAccountConfig });

  console.log("STAGE 3: deployed safe");
  const safeAddress = await protocolKitOwner1.getAddress();

  console.log("Your Safe has been deployed:");
  console.log(`https://sepolia.etherscan.io/address/${safeAddress}`);
  console.log(`https://app.safe.global/sep:${safeAddress}`);

  const safeAmount = ethers.parseUnits("0.01", "ether").toString();

  const transactionParameters = {
    to: safeAddress,
    value: safeAmount,
  };

  console.log("STAGE 4: Raise funds");
  const tx = await owner1Signer.sendTransaction(transactionParameters);

  console.log("Fundraising.");
  console.log(
    `Deposit Transaction: https://sepolia.etherscan.io/tx/${tx.hash}`
  );

  // ----------------------------------------------------------
  // Propose tx

  const destination = "0xD720205354C0b922666aAf6113C45eF8026a409E";
  const amount = ethers.parseUnits("0.005", "ether").toString();

  const safeTransactionData: MetaTransactionData = {
    to: destination,
    data: "0x",
    value: amount,
  };

  // Create a Safe transaction with the provided parameters
  const safeTransaction = await protocolKitOwner1.createTransaction({
    transactions: [safeTransactionData],
  });

  // Deterministic hash based on transaction parameters
  const safeTxHash = await protocolKitOwner1.getTransactionHash(
    safeTransaction
  );

  // Sign transaction to verify that the transaction is coming from owner 1
  const senderSignature = await protocolKitOwner1.signHash(safeTxHash);

  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress: await owner1Signer.getAddress(),
    senderSignature: senderSignature.data,
  });

  const pendingTransactions = (await apiKit.getPendingTransactions(safeAddress))
    .results;

  // Assumes that the first pending transaction is the transaction you want to confirm
  const transaction = pendingTransactions[0];
  const proposeTxHash = transaction.safeTxHash;

  const ethAdapterOwner2 = new EthersAdapter({
    ethers,
    signerOrProvider: owner2Signer,
  });

  const protocolKitOwner2 = await Safe.create({
    ethAdapter: ethAdapterOwner2,
    safeAddress,
  });

  const signature = await protocolKitOwner2.signHash(proposeTxHash);
  const response = await apiKit.confirmTransaction(
    proposeTxHash,
    signature.data
  );

  // ----------------------------------------------------------
  //   Execute the tx
  const executeTransaction = await apiKit.getTransaction(proposeTxHash);
  const executeTxResponse = await protocolKitOwner1.executeTransaction(
    executeTransaction
  );
  const receipt = await executeTxResponse.transactionResponse?.wait();

  console.log("Transaction executed:");
  console.log(`https://sepolia.etherscan.io/tx/${receipt?.getTransaction()}`);

  const afterBalance = await protocolKitOwner1.getBalance();

  console.log(
    `The final balance of the Safe: ${ethers.formatUnits(
      afterBalance,
      "ether"
    )} ETH`
  );
}

main();
