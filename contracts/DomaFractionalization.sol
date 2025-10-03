// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FractionalToken.sol";

/**
 * @title DomaFractionalization
 * @notice Enables fractionalization of Doma Protocol Domain Ownership Tokens
 * @dev Allows domain NFT owners to convert their NFTs into fungible fractional tokens
 */
contract DomaFractionalization is IERC721Receiver, ReentrancyGuard, Ownable {
    struct FractionalTokenInfo {
        string name;
        string symbol;
    }

    struct FractionalizedDomain {
        address ownershipToken;
        uint256 tokenId;
        address fractionalToken;
        uint256 minimumBuyoutPrice;
        uint256 tokenizationVersion;
        bool isBoughtOut;
        uint256 buyoutPrice;
        address originalOwner;
    }

    // USDC token for buyouts and redemptions
    IERC20 public immutable usdc;

    // Price oracle interface (DEX)
    IPriceOracle public priceOracle;

    // Protocol fee in basis points (e.g., 250 = 2.5%)
    uint256 public constant PROTOCOL_FEE_BPS = 250;
    uint256 public constant BASIS_POINTS = 10000;

    // Mapping from ownership token address => token ID => fractionalized domain info
    mapping(address => mapping(uint256 => FractionalizedDomain)) public fractionalizedDomains;

    // Reverse mapping from fractional token address to domain info
    mapping(address => FractionalizedDomain) public fractionalTokenToDomain;

    // Mapping to track tokenization versions for re-fractionalization
    mapping(address => mapping(uint256 => uint256)) public tokenizationVersions;

    // Protocol fee accumulator
    uint256 public accumulatedFees;

    event NameTokenFractionalized(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        address fractionalTokenAddress,
        FractionalTokenInfo fractionalTokenInfo,
        uint256 minimumBuyoutPrice,
        uint256 tokenizationVersion
    );

    event NameTokenBoughtOut(
        address indexed tokenAddress,
        uint256 indexed tokenId,
        address fractionalTokenAddress,
        uint256 buyoutPrice,
        address indexed newOwner,
        uint256 tokenizationVersion
    );

    event FractionalTokenExchanged(
        address indexed fractionalToken,
        address indexed holder,
        uint256 amount,
        uint256 usdcAmount
    );

    constructor(address _usdc, address _priceOracle) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_priceOracle != address(0), "Invalid oracle address");
        usdc = IERC20(_usdc);
        priceOracle = IPriceOracle(_priceOracle);
    }

    /**
     * @notice Fractionalize domain ownership token (NFT) and mint fractional token
     * @param tokenAddress Address of the Domain Ownership Token contract
     * @param tokenId The token ID of the domain ownership token
     * @param fractionalTokenInfo The structure that defines the fractional token information
     * @param totalSupply Total supply of fractional tokens to mint
     * @param minimumBuyoutPrice The minimum buyout price in USDC
     * @param launchpad Address of approved launchpad to receive tokens
     */
    function fractionalizeOwnershipToken(
        address tokenAddress,
        uint256 tokenId,
        FractionalTokenInfo memory fractionalTokenInfo,
        uint256 totalSupply,
        uint256 minimumBuyoutPrice,
        address launchpad
    ) external nonReentrant returns (address) {
        require(totalSupply > 0, "Total supply must be positive");
        require(minimumBuyoutPrice > 0, "Minimum buyout price must be positive");
        require(launchpad != address(0), "Invalid launchpad address");

        // Verify ownership and transfer NFT to this contract
        address nftOwner = IERC721(tokenAddress).ownerOf(tokenId);
        require(nftOwner == msg.sender, "Not token owner");

        IERC721(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId);

        // Increment tokenization version for this domain
        uint256 version = ++tokenizationVersions[tokenAddress][tokenId];

        // Deploy new fractional token contract
        FractionalToken fractionalToken = new FractionalToken(
            fractionalTokenInfo.name,
            fractionalTokenInfo.symbol,
            address(this)
        );

        // Calculate protocol fee (e.g., 2.5% of total supply)
        uint256 protocolFeeAmount = (totalSupply * PROTOCOL_FEE_BPS) / BASIS_POINTS;
        uint256 launchpadAmount = totalSupply - protocolFeeAmount;

        // Mint tokens
        fractionalToken.mint(launchpad, launchpadAmount);
        fractionalToken.mint(address(this), protocolFeeAmount);

        // Store fractionalization info
        FractionalizedDomain memory domainInfo = FractionalizedDomain({
            ownershipToken: tokenAddress,
            tokenId: tokenId,
            fractionalToken: address(fractionalToken),
            minimumBuyoutPrice: minimumBuyoutPrice,
            tokenizationVersion: version,
            isBoughtOut: false,
            buyoutPrice: 0,
            originalOwner: msg.sender
        });

        fractionalizedDomains[tokenAddress][tokenId] = domainInfo;
        fractionalTokenToDomain[address(fractionalToken)] = domainInfo;

        emit NameTokenFractionalized(
            tokenAddress,
            tokenId,
            address(fractionalToken),
            fractionalTokenInfo,
            minimumBuyoutPrice,
            version
        );

        return address(fractionalToken);
    }

    /**
     * @notice Buy out domain ownership token by paying the buyout price
     * @param tokenAddress Address of the Domain Ownership Token contract
     * @param tokenId The ID of the token
     */
    function buyoutOwnershipToken(
        address tokenAddress,
        uint256 tokenId
    ) external nonReentrant {
        FractionalizedDomain storage domain = fractionalizedDomains[tokenAddress][tokenId];
        require(domain.fractionalToken != address(0), "Domain not fractionalized");
        require(!domain.isBoughtOut, "Already bought out");

        // Calculate buyout price
        uint256 buyoutPrice = getOwnershipTokenBuyoutPrice(tokenAddress, tokenId);

        // Transfer USDC from buyer to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), buyoutPrice),
            "USDC transfer failed"
        );

        // Mark as bought out
        domain.isBoughtOut = true;
        domain.buyoutPrice = buyoutPrice;

        // Transfer NFT to buyer
        IERC721(tokenAddress).safeTransferFrom(address(this), msg.sender, tokenId);

        emit NameTokenBoughtOut(
            tokenAddress,
            tokenId,
            domain.fractionalToken,
            buyoutPrice,
            msg.sender,
            domain.tokenizationVersion
        );
    }

    /**
     * @notice Exchange fractional tokens for USDC after buyout
     * @param fractionalToken The address of fractional token to exchange
     * @param amount The amount of fractional token to exchange
     */
    function exchangeFractionalToken(
        address fractionalToken,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "Amount must be positive");

        // Find the domain associated with this fractional token
        FractionalizedDomain memory domain = findDomainByFractionalToken(fractionalToken);
        require(domain.fractionalToken == fractionalToken, "Invalid fractional token");
        require(domain.isBoughtOut, "Domain not bought out");

        // Calculate USDC amount to return
        FractionalToken token = FractionalToken(fractionalToken);
        uint256 totalSupply = token.totalSupply();
        uint256 usdcAmount = (amount * domain.buyoutPrice) / totalSupply;

        // Burn fractional tokens
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        token.burn(amount);

        // Transfer USDC to holder
        require(usdc.transfer(msg.sender, usdcAmount), "USDC transfer failed");

        emit FractionalTokenExchanged(fractionalToken, msg.sender, amount, usdcAmount);
    }

    /**
     * @notice Get the buyout price of a domain ownership token
     * @param tokenAddress Address of the Domain Ownership Token contract
     * @param tokenId The ID of the ownership token
     * @return Buyout price in USDC
     */
    function getOwnershipTokenBuyoutPrice(
        address tokenAddress,
        uint256 tokenId
    ) public view returns (uint256) {
        FractionalizedDomain memory domain = fractionalizedDomains[tokenAddress][tokenId];
        require(domain.fractionalToken != address(0), "Domain not fractionalized");

        // Get current price from DEX
        uint256 tokenPrice = priceOracle.getPrice(domain.fractionalToken);

        // Calculate FDMC (Fully Diluted Market Cap)
        FractionalToken token = FractionalToken(domain.fractionalToken);
        uint256 totalSupply = token.totalSupply();
        uint256 fdmc = totalSupply * tokenPrice / 1e18; // Assuming 18 decimals

        // Return max(MBP, FDMC)
        return fdmc > domain.minimumBuyoutPrice ? fdmc : domain.minimumBuyoutPrice;
    }

    /**
     * @notice Find domain info by fractional token address
     * @param fractionalToken Address of the fractional token
     * @return Domain info
     */
    function findDomainByFractionalToken(
        address fractionalToken
    ) internal view returns (FractionalizedDomain memory) {
        return fractionalTokenToDomain[fractionalToken];
    }

    /**
     * @notice Get domain fractionalization info
     * @param tokenAddress Address of the Domain Ownership Token contract
     * @param tokenId Token ID
     * @return Domain fractionalization info
     */
    function getDomainInfo(
        address tokenAddress,
        uint256 tokenId
    ) external view returns (FractionalizedDomain memory) {
        return fractionalizedDomains[tokenAddress][tokenId];
    }

    /**
     * @notice Update price oracle address
     * @param newOracle New price oracle address
     */
    function updatePriceOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        priceOracle = IPriceOracle(newOracle);
    }

    /**
     * @notice Withdraw accumulated protocol fees
     * @param amount Amount to withdraw
     */
    function withdrawProtocolFees(uint256 amount) external onlyOwner {
        require(usdc.transfer(owner(), amount), "Withdrawal failed");
    }

    /**
     * @notice Withdraw accumulated fractional token fees
     * @param token Address of fractional token
     * @param amount Amount to withdraw
     */
    function withdrawFractionalTokenFees(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Withdrawal failed");
    }

    /**
     * @notice Required for receiving ERC721 tokens
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}

/**
 * @title IPriceOracle
 * @notice Interface for price oracle (DEX)
 */
interface IPriceOracle {
    /**
     * @notice Get price of a token in USDC
     * @param token Address of the token
     * @return Price in USDC (18 decimals)
     */
    function getPrice(address token) external view returns (uint256);
}
