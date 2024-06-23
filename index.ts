import { ethers } from "ethers";
import Safe from "@safe-global/protocol-kit";
import dotenv from "dotenv";
import SafeApiKit from "@safe-global/api-kit";
import { MetaTransactionData } from "@safe-global/safe-core-sdk-types";
import { TransactionResponse } from "ethers";

dotenv.config();

async function main() {
  const RPC_URL = "https://eth-sepolia.public.blastapi.io";
  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Initialize signers
  const owner1Signer = new ethers.Wallet(
    process.env.OWNER_1_PRIVATE_KEY!,
    provider
  );

  // Initialize API kit
  const apiKit = new SafeApiKit({
    chainId: 11155111n,
  });

  const safeAddress = "0x459364262cdF91c7f95C6ec8Bdb8F3F0055a3268"; // ADD SAFE ADDRESS HERE
  const protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: process.env.OWNER_1_PRIVATE_KEY,
    safeAddress,
  });

  // ----------------------------------------------------------
  // Propose tx

  const destination = "0xD720205354C0b922666aAf6113C45eF8026a409E";
  const amount = ethers.parseUnits("0.0005", "ether").toString();

  const safeTransactionData: MetaTransactionData = {
    to: destination,
    data: "0x",
    value: amount,
  };

  // Create a Safe transaction with the provided parameters
  const safeTransaction = await protocolKit.createTransaction({
    transactions: [safeTransactionData],
  });

  // Deterministic hash based on transaction parameters
  const safeTxHash = await protocolKit.getTransactionHash(safeTransaction);

  // Sign transaction to verify that the transaction is coming from owner 1
  const senderSignature = await protocolKit.signHash(safeTxHash);

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

  const protocolKitOwner2 = await Safe.init({
    provider: RPC_URL,
    signer: process.env.OWNER_2_PRIVATE_KEY,
    safeAddress,
  });

  const signature = await protocolKitOwner2.signHash(proposeTxHash);
  const response = await apiKit.confirmTransaction(
    proposeTxHash,
    signature.data
  );

  // ----------------------------------------------------------
  //   Execute the tx
  const executeSafeTransaction = await apiKit.getTransaction(proposeTxHash);
  const executeTxResponse = await protocolKit.executeTransaction(
    executeSafeTransaction
  );
  const receipt = await executeTxResponse.transactionResponse as TransactionResponse

  console.log("Transaction executed:");
  console.log(`https://sepolia.etherscan.io/tx/${receipt.hash}`);

  const afterBalance = await protocolKit.getBalance();

  console.log(
    `The final balance of the Safe: ${ethers.formatUnits(
      afterBalance,
      "ether"
    )} ETH`
  );
}

main();
