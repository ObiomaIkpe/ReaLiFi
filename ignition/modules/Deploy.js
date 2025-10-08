const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ReaLiFiModule", (m) => {
  // Deploy RealifiFractionalToken contract
  const realifiFractionalToken = m.contract("RealifiFractionalToken", []);

  // Deploy MockUSDC contract
  const mockUSDC = m.contract("MockUSDC", []);

  // Deploy ReaLiFi contract with the address of RealifiFractionalToken contract
  const reaLiFi = m.contract("ReaLiFi", [realifiFractionalToken, mockUSDC]);

  // Set the ReaLiFi address in the RealifiFractionalToken contract
  m.call(realifiFractionalToken, "setReaLiFi", [reaLiFi]);

  // Deploy MyToken contract
  //const myToken = m.contract("MyToken", []);

  return { realifiFractionalToken, mockUSDC, reaLiFi };
});