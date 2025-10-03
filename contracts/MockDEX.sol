// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockDEX
 * @notice Mock DEX contract for price oracle simulation in testing/development
 * @dev In production, this would integrate with real DEX protocols like Uniswap
 */
contract MockDEX is Ownable {
    // Mapping from token address to price in USDC (18 decimals)
    mapping(address => uint256) public tokenPrices;

    // Mapping from token pair to liquidity
    mapping(address => mapping(address => uint256)) public liquidity;

    event PriceUpdated(address indexed token, uint256 price);
    event LiquidityAdded(address indexed tokenA, address indexed tokenB, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set price for a token (for testing purposes)
     * @param token Address of the token
     * @param price Price in USDC (18 decimals)
     */
    function setPrice(address token, uint256 price) external onlyOwner {
        require(token != address(0), "Invalid token address");
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }

    /**
     * @notice Get price of a token in USDC
     * @param token Address of the token
     * @return Price in USDC (18 decimals)
     */
    function getPrice(address token) external view returns (uint256) {
        uint256 price = tokenPrices[token];
        require(price > 0, "Price not set");
        return price;
    }

    /**
     * @notice Simulate adding liquidity to a pool
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @param amount Amount of liquidity
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amount
    ) external onlyOwner {
        require(tokenA != address(0) && tokenB != address(0), "Invalid token addresses");
        liquidity[tokenA][tokenB] += amount;
        liquidity[tokenB][tokenA] += amount;
        emit LiquidityAdded(tokenA, tokenB, amount);
    }

    /**
     * @notice Get liquidity for a token pair
     * @param tokenA Address of first token
     * @param tokenB Address of second token
     * @return Liquidity amount
     */
    function getLiquidity(address tokenA, address tokenB) external view returns (uint256) {
        return liquidity[tokenA][tokenB];
    }

    /**
     * @notice Simulate price calculation based on market cap
     * @param token Address of the token
     * @param totalSupply Total supply of the token
     * @param marketCap Market cap in USDC
     */
    function setPriceByMarketCap(
        address token,
        uint256 totalSupply,
        uint256 marketCap
    ) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(totalSupply > 0, "Total supply must be positive");
        uint256 price = (marketCap * 1e18) / totalSupply;
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }
}
