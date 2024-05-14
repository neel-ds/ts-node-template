import { ethers } from "ethers";

const wallet1 = ethers.Wallet.createRandom();

const wallet2 = ethers.Wallet.createRandom();

const wallet3 = ethers.Wallet.createRandom();

console.log("-------------------WALLETS----------------");
console.log("Pub key:", wallet1.address);
console.log("Priv key:", wallet1.privateKey);

console.log("---------------------------------------------");
console.log("Pub key:", wallet2.address);
console.log("Priv key:", wallet2.privateKey);

console.log("---------------------------------------------");
console.log("Pub key:", wallet3.address);
console.log("Priv key:", wallet3.privateKey);
