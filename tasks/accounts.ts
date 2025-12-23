import { task } from "hardhat/config";
import { formatEther } from "ethers";

task("accounts", "Prints the list of accounts with detailed information", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  const provider = hre.ethers.provider;
  const network = await provider.getNetwork();

  console.log(`\n📋 Account Information`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Total accounts: ${accounts.length}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const balance = await provider.getBalance(account.address);
    const txCount = await provider.getTransactionCount(account.address);

    console.log(`Account #${i}`);
    console.log(`  Address:      ${account.address}`);
    console.log(`  Balance:      ${formatEther(balance)} ETH`);
    console.log(`  Tx Count:     ${txCount}`);
    console.log(``);
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
});

task("account:balance", "Gets the balance of a specific account")
  .addParam("address", "The account address to check")
  .setAction(async (taskArgs, hre) => {
    const provider = hre.ethers.provider;
    const address = taskArgs.address;

    try {
      const balance = await provider.getBalance(address);
      const txCount = await provider.getTransactionCount(address);
      const code = await provider.getCode(address);
      const isContract = code !== "0x";

      console.log(`\n📊 Account Details`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Address:        ${address}`);
      console.log(`Balance:        ${formatEther(balance)} ETH`);
      console.log(`Tx Count:       ${txCount}`);
      console.log(`Type:           ${isContract ? "Contract" : "EOA (Externally Owned Account)"}`);
      if (isContract) {
        console.log(`Code Size:      ${(code.length - 2) / 2} bytes`);
      }
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    } catch (error) {
      console.error(`Error fetching account info: ${error}`);
    }
  });
