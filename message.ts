import SafeApiKit from "@safe-global/api-kit";
import Safe, {
  EthSafeSignature,
  SigningMethod,
  buildContractSignature,
  buildSignatureBytes,
  hashSafeMessage,
} from "@safe-global/protocol-kit";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const RPC_URL = "https://eth-sepolia.public.blastapi.io";

  // An example of a string message
  const STRING_MESSAGE = "I'm the owner of this Safe account";

  const safeAddress = "0x459364262cdF91c7f95C6ec8Bdb8F3F0055a3268"; // ADD SAFE ADDRESS HERE

  let protocolKit = await Safe.init({
    provider: RPC_URL,
    signer: process.env.OWNER_1_PRIVATE_KEY,
    safeAddress,
  });

  console.log(protocolKit);

  let safeMessage = protocolKit.createMessage(STRING_MESSAGE);

  // Create a new message object
  let messageSafe2_3 = protocolKit.createMessage(STRING_MESSAGE);

  // Connect OWNER_4_ADDRESS and SAFE_2_3_ADDRESS
  protocolKit = await protocolKit.connect({
    provider: RPC_URL,
    signer: process.env.OWNER_1_PRIVATE_KEY,
    safeAddress: safeAddress,
  });

  // Sign the messageSafe2_3 with OWNER_4_ADDRESS
  // After this, the messageSafe2_3 contains the signature from OWNER_4_ADDRESS
  messageSafe2_3 = await protocolKit.signMessage(
    messageSafe2_3,
    SigningMethod.SAFE_SIGNATURE,
    safeAddress
  );

  // Connect OWNER_5_ADDRESS
  protocolKit = await protocolKit.connect({
    provider: RPC_URL,
    signer: process.env.OWNER_2_PRIVATE_KEY,
  });

  // Sign the messageSafe2_3 with OWNER_5_ADDRESS
  // After this, the messageSafe2_3 contains the signature from OWNER_5_ADDRESS
  messageSafe2_3 = await protocolKit.signMessage(
    messageSafe2_3,
    SigningMethod.SAFE_SIGNATURE,
    safeAddress
  );

  // Build the contract signature of SAFE_2_3_ADDRESS
  const signatureSafe2_3 = await buildContractSignature(
    Array.from(messageSafe2_3.signatures.values()),
    safeAddress
  );

  // Add the signatureSafe2_3 to safeMessage
  // After this, the safeMessage contains the signature from OWNER_1_ADDRESS, OWNER_2_ADDRESS, SAFE_1_1_ADDRESS and SAFE_2_3_ADDRESS
  safeMessage.addSignature(signatureSafe2_3);

  const signatureOwner1 = safeMessage.getSignature(
    process.env.OWNER_1_PRIVATE_KEY!
  ) as EthSafeSignature;

  // Instantiate the API Kit
  // Use the chainId where you have the Safe account deployed
  const apiKit = new SafeApiKit({
    chainId: 11155111n,
  });

  // Propose the message
  apiKit.addMessage(safeAddress, {
    message: STRING_MESSAGE,
    signature: buildSignatureBytes([signatureOwner1]),
  });

  // Get the safeMessageHash
  const safeMessageHash = await protocolKit.getSafeMessageHash(
    hashSafeMessage(STRING_MESSAGE)
  );

  // Get the signature from OWNER_2_ADDRESS
  const signatureOwner2 = safeMessage.getSignature(
    process.env.OWNER_2_ADDRESS!
  ) as EthSafeSignature;

  // Add signature from OWNER_2_ADDRESS
  await apiKit.addMessageSignature(
    safeMessageHash,
    buildSignatureBytes([signatureOwner2])
  );

  await apiKit.addMessageSignature(
    safeMessageHash,
    buildSignatureBytes([signatureSafe2_3])
  );

  const confirmedMessage = await apiKit.getMessage(safeMessageHash);

  console.log(
    `https://app.safe.global/transactions/messages?safe=sep:${safeAddress}`
  );
  console.log("\n Confirmed", confirmedMessage);
}

main();
