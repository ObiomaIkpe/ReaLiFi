// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title RealEstateToken
/// @notice An ERC20 token representing fractional ownership in real estate assets managed by the RealEstateDApp contract.
/// @dev Extends OpenZeppelin’s ERC20 and Ownable. Minting is restricted to the contract owner or the RealEstateDApp contract.
/// Used for fractionalizing real estate NFTs in the RealEstateDApp ecosystem.
contract RealifiFractionalToken is ERC20, Ownable {
    // --- Constants ---
    /// @notice Zero address for validation.
    address private constant ZERO_ADDRESS = address(0);

    // --- State Variables ---
    /// @notice Address of the ReaLiFi contract authorized to mint tokens.
    address public reaLiFi;

    // --- Custom Errors ---
    /// @notice Thrown when an unauthorized caller attempts to perform a restricted action.
    error NotAuthorized();

    // --- Constructor ---
    /// @notice Initializes the ERC20 token with name "RealEstateToken" and symbol "RET".
    constructor() ERC20("RealifiFractionalToken", "RFT") {}

    // --- Modifiers ---
    /// @notice Restricts access to the contract owner or the RealEstateDApp contract.
    modifier onlyOwnerOrReaLiFi() {
        if (msg.sender != owner() && msg.sender != reaLiFi) revert NotAuthorized();
        _;
    }

    // --- Functions ---
    /// @notice Sets the address of the RealEstateDApp contract.
    /// @dev Only callable by the contract owner. Updates the address authorized to mint tokens.
    /// @param _reaLiFi The address of the RealEstateDApp contract.
    function setReaLiFi(address _reaLiFi) external onlyOwner {
        reaLiFi = _reaLiFi;
    }

    /// @notice Mints new tokens to a specified address.
    /// @dev Only callable by the contract owner or the RealEstateDApp contract. Uses ERC20’s internal _mint.
    /// @param to The address to receive the minted tokens.
    /// @param amount The number of tokens to mint (18 decimals).
    function mint(address to, uint256 amount) external onlyOwnerOrReaLiFi {
        _mint(to, amount);
    }
}