// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DomainRegistry
 * @notice Enhanced domain registration system for Credora with built-in valuation
 */
contract DomainRegistry is ERC721Enumerable, AccessControl, ReentrancyGuard {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant VALUATOR_ROLE = keccak256("VALUATOR_ROLE");

    struct DomainMetadata {
        string name;
        string tld;
        uint256 registrationTime;
        uint256 expiryTime;
        uint256 lastValuation;
        uint256 valuationConfidence;
        bool isPremium;
        string ipfsHash;
    }

    struct ValuationData {
        uint256 baseValue;
        uint256 marketMultiplier;
        uint256 lastUpdated;
        address valuator;
    }

    uint256 private _domainCounter;
    mapping(uint256 => DomainMetadata) public domainMetadata;
    mapping(uint256 => ValuationData) public valuations;
    mapping(string => bool) public domainExists;
    mapping(uint256 => bool) public domainLocked;

    uint256 public constant REGISTRATION_PERIOD = 365 days;
    uint256 public registrationFee = 0.01 ether;

    event DomainRegistered(
        uint256 indexed tokenId,
        string name,
        address indexed owner,
        uint256 expiryTime
    );

    event ValuationUpdated(
        uint256 indexed tokenId,
        uint256 newValue,
        uint256 confidence,
        address indexed valuator
    );

    event DomainRenewed(
        uint256 indexed tokenId,
        uint256 newExpiryTime
    );

    constructor() ERC721("Credora Domain", "CDOM") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    function registerDomain(
        string memory _name,
        string memory _tld,
        address _owner
    ) external payable nonReentrant returns (uint256) {
        require(msg.value >= registrationFee, "Insufficient registration fee");
        require(!domainExists[_name], "Domain already registered");
        require(bytes(_name).length > 0 && bytes(_name).length <= 63, "Invalid domain length");

        uint256 tokenId = ++_domainCounter;
        _safeMint(_owner, tokenId);

        domainMetadata[tokenId] = DomainMetadata({
            name: _name,
            tld: _tld,
            registrationTime: block.timestamp,
            expiryTime: block.timestamp + REGISTRATION_PERIOD,
            lastValuation: 0,
            valuationConfidence: 0,
            isPremium: _isPremiumDomain(_name),
            ipfsHash: ""
        });

        domainExists[_name] = true;

        emit DomainRegistered(tokenId, _name, _owner, block.timestamp + REGISTRATION_PERIOD);

        return tokenId;
    }

    function updateValuation(
        uint256 _tokenId,
        uint256 _baseValue,
        uint256 _marketMultiplier,
        uint256 _confidence
    ) external onlyRole(VALUATOR_ROLE) {
        require(_exists(_tokenId), "Domain does not exist");
        require(!domainLocked[_tokenId], "Domain is locked");

        valuations[_tokenId] = ValuationData({
            baseValue: _baseValue,
            marketMultiplier: _marketMultiplier,
            lastUpdated: block.timestamp,
            valuator: msg.sender
        });

        domainMetadata[_tokenId].lastValuation = _baseValue * _marketMultiplier / 100;
        domainMetadata[_tokenId].valuationConfidence = _confidence;

        emit ValuationUpdated(
            _tokenId,
            domainMetadata[_tokenId].lastValuation,
            _confidence,
            msg.sender
        );
    }

    function renewDomain(uint256 _tokenId) external payable {
        require(_exists(_tokenId), "Domain does not exist");
        require(ownerOf(_tokenId) == msg.sender, "Not domain owner");
        require(msg.value >= registrationFee, "Insufficient renewal fee");

        DomainMetadata storage metadata = domainMetadata[_tokenId];

        if (block.timestamp > metadata.expiryTime) {
            metadata.expiryTime = block.timestamp + REGISTRATION_PERIOD;
        } else {
            metadata.expiryTime += REGISTRATION_PERIOD;
        }

        emit DomainRenewed(_tokenId, metadata.expiryTime);
    }

    function lockDomain(uint256 _tokenId, bool _lock) external {
        require(ownerOf(_tokenId) == msg.sender, "Not domain owner");
        domainLocked[_tokenId] = _lock;
    }

    function updateIPFSHash(uint256 _tokenId, string memory _hash) external {
        require(ownerOf(_tokenId) == msg.sender, "Not domain owner");
        domainMetadata[_tokenId].ipfsHash = _hash;
    }

    function getDomainValue(uint256 _tokenId) external view returns (uint256) {
        return domainMetadata[_tokenId].lastValuation;
    }

    function isExpired(uint256 _tokenId) external view returns (bool) {
        return block.timestamp > domainMetadata[_tokenId].expiryTime;
    }

    function _isPremiumDomain(string memory _name) private pure returns (bool) {
        bytes memory nameBytes = bytes(_name);
        return nameBytes.length <= 3 ||
               (nameBytes.length == 4 && _isNumeric(_name));
    }

    function _isNumeric(string memory _str) private pure returns (bool) {
        bytes memory b = bytes(_str);
        for(uint i = 0; i < b.length; i++){
            if(!(uint8(b[i]) >= 48 && uint8(b[i]) <= 57)) {
                return false;
            }
        }
        return true;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return ownerOf(tokenId) != address(0);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}