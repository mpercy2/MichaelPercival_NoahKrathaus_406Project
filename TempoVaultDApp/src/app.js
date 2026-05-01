// replace after running deploy script.
const TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const VAULT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

let provider;
let signer;
let userAddress;
let tokenContract;
let vaultContract;
let tokenDecimals = 18;

function setStatus(message) {
  document.getElementById("statusMessage").innerText = message;
}

async function loadJson(path) {
  const response = await fetch(path);
  return await response.json();
}

async function connectWallet() {
  try {
    if (!window.ethereum) {
      alert("MetaMask is not installed.");
      return;
    }

    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    signer = provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("walletAddress").innerText = userAddress;

    const tokenJson = await loadJson("./ERC20Token.json");
    const vaultJson = await loadJson("./Vault.json");

    tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenJson.abi, signer);
    vaultContract = new ethers.Contract(VAULT_ADDRESS, vaultJson.abi, signer);

    try {
      tokenDecimals = await tokenContract.decimals();
    } catch (error) {
      tokenDecimals = 18;
    }

    setStatus("Wallet connected.");
    await refreshBalances();
  } catch (error) {
    console.error(error);
    setStatus("Error connecting wallet. Check console.");
  }
}

async function approveVault() {
  try {
    if (!tokenContract) {
      alert("Connect wallet first.");
      return;
    }

    const amountInput = document.getElementById("depositAmount").value;

    if (!amountInput || Number(amountInput) <= 0) {
      alert("Enter an amount to approve.");
      return;
    }

    const amount = ethers.utils.parseUnits(amountInput, tokenDecimals);
    setStatus("Approving vault...");

    const tx = await tokenContract.approve(VAULT_ADDRESS, amount);
    await tx.wait();

    setStatus("Vault approved.");
  } catch (error) {
    console.error(error);
    setStatus("Approve failed. Check console.");
  }
}

async function deposit() {
  try {
    if (!vaultContract) {
      alert("Connect wallet first.");
      return;
    }

    const amountInput = document.getElementById("depositAmount").value;

    if (!amountInput || Number(amountInput) <= 0) {
      alert("Enter an amount to deposit.");
      return;
    }

    const amount = ethers.utils.parseUnits(amountInput, tokenDecimals);
    setStatus("Depositing tokens...");

    const tx = await vaultContract.deposit(amount);
    await tx.wait();

    setStatus("Deposit complete.");
    await refreshBalances();
  } catch (error) {
    console.error(error);
    setStatus("Deposit failed. Make sure you approved first.");
  }
}

async function withdraw() {
  try {
    if (!vaultContract) {
      alert("Connect wallet first.");
      return;
    }

    const sharesInput = document.getElementById("withdrawAmount").value;

    if (!sharesInput || Number(sharesInput) <= 0) {
      alert("Enter shares to withdraw.");
      return;
    }

    const shares = ethers.utils.parseUnits(sharesInput, tokenDecimals);
    setStatus("Withdrawing...");

    const tx = await vaultContract.withdraw(shares);
    await tx.wait();

    setStatus("Withdraw complete.");
    await refreshBalances();
  } catch (error) {
    console.error(error);
    setStatus("Withdraw failed. Check your vault share balance.");
  }
}

async function refreshBalances() {
  try {
    if (!tokenContract || !vaultContract || !userAddress) {
      return;
    }

    const tokenBalance = await tokenContract.balanceOf(userAddress);
    const vaultBalance = await vaultContract.balanceOf(userAddress);
    const adminAddress = await vaultContract.admin();
    const adminBalance = await tokenContract.balanceOf(adminAddress);
    const feePercent = await vaultContract.feePercent();
    const membershipBalance = await vaultContract._balanceOfmembershipToken(userAddress);

    document.getElementById("tokenBalance").innerText =
      ethers.utils.formatUnits(tokenBalance, tokenDecimals);

    document.getElementById("vaultBalance").innerText =
      ethers.utils.formatUnits(vaultBalance, tokenDecimals);

    document.getElementById("adminAddress").innerText = adminAddress;

    document.getElementById("adminBalance").innerText =
      ethers.utils.formatUnits(adminBalance, tokenDecimals);

    document.getElementById("feePercent").innerText = `${Number(feePercent) / 100}%`;

    document.getElementById("membershipStatus").innerText =
      Number(membershipBalance) > 0 ? "Active" : "Not active / revoked";
  } catch (error) {
    console.error(error);
    setStatus("Could not refresh balances. Check console.");
  }
}

document.getElementById("connectButton").addEventListener("click", connectWallet);
document.getElementById("approveButton").addEventListener("click", approveVault);
document.getElementById("depositButton").addEventListener("click", deposit);
document.getElementById("withdrawButton").addEventListener("click", withdraw);
document.getElementById("refreshButton").addEventListener("click", refreshBalances);
