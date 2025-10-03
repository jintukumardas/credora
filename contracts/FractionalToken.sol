// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FractionalToken
 * @notice ERC-20 token representing fractional ownership of a domain NFT
 * @dev Only the fractionalization contract can mint and burn tokens to prevent dilution
 */
contract FractionalToken is ERC20, Ownable {
    /**
     * @notice Constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param fractionalizer Address of the DomaFractionalization contract
     */
    constructor(
        string memory name,
        string memory symbol,
        address fractionalizer
    ) ERC20(name, symbol) Ownable(fractionalizer) {
        require(fractionalizer != address(0), "Invalid fractionalizer address");
    }

    /**
     * @notice Mint fractional tokens
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burn fractional tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Burn fractional tokens from a specific address
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
