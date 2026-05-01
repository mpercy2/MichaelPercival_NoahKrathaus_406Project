const hre = require("hardhat");

async function main() {
  const [admin, user] = await hre.ethers.getSigners();

  console.log("Admin/deployer account:", admin.address);
  console.log("Demo user account:", user.address);

  // deploy ERC-20
  const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
  const tempoToken = await ERC20Token.deploy("TempoToken", "TEMPO", 1000000);
  await tempoToken.waitForDeployment();
  const tokenAddress = await tempoToken.getAddress();
  console.log("ERC20Token deployed to:", tokenAddress);

  // deploy ERC-721
  const TempoNFT = await hre.ethers.getContractFactory("TempoNFT");
  const tempoNFT = await TempoNFT.deploy(admin.address);
  await tempoNFT.waitForDeployment();
  const nftAddress = await tempoNFT.getAddress();
  console.log("TempoNFT deployed to:", nftAddress);

  // deploy vault using ERC-20 address.
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(tokenAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault deployed to:", vaultAddress);

  console.log(`const TOKEN_ADDRESS = "${tokenAddress}";`);
  console.log(`const VAULT_ADDRESS = "${vaultAddress}";`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
