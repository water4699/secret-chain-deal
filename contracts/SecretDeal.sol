// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SecretDeal - Encrypted Multi-Party Negotiation Platform
/// @author secret-chain-deal
/// @notice A contract for managing encrypted deal offers using FHEVM technology.
/// @dev Uses FHE (Fully Homomorphic Encryption) to keep offer values encrypted until revealed.
contract SecretDeal is ZamaEthereumConfig {
    /// @notice Counter for generating unique deal IDs
    uint256 public dealCounter;

    /// @notice Maximum length for deal names to prevent excessive gas costs
    uint256 public constant MAX_DEAL_NAME_LENGTH = 256;

    /// @notice Maximum number of parties allowed per deal to prevent gas limit issues
    uint256 public constant MAX_PARTIES_PER_DEAL = 100;

    /// @notice Structure representing a deal
    struct Deal {
        string dealName;
        uint256 requiredParties;
        uint256 createdAt;
        bool finalized;
        bool cancelled;
        address creator;
        address[] parties;
    }

    /// @notice Structure representing an encrypted offer
    struct Offer {
        address party;
        euint32 encryptedValue;
        string title;
        string description;
        uint256 timestamp;
        bool revealed;
    }

    /// @notice Mapping from deal ID to Deal struct
    mapping(uint256 => Deal) public deals;

    /// @notice Mapping from deal ID to party address to Offer struct
    mapping(uint256 => mapping(address => Offer)) public offers;

    /// @notice Mapping from deal ID to offer count
    mapping(uint256 => uint256) public offerCount;

    /// @notice Mapping from party address to array of deal IDs they participate in
    mapping(address => uint256[]) private partyDeals;

    /// @notice Emitted when a new deal is created
    event DealCreated(
        uint256 indexed dealId,
        string dealName,
        uint256 requiredParties,
        address creator
    );

    /// @notice Emitted when an offer is submitted
    event OfferSubmitted(
        uint256 indexed dealId,
        address indexed party,
        string title
    );

    /// @notice Emitted when an offer is revealed
    event OfferRevealed(
        uint256 indexed dealId,
        address indexed party
    );

    /// @notice Emitted when a deal is finalized
    event DealFinalized(
        uint256 indexed dealId,
        uint256 timestamp
    );

    /// @notice Emitted when a deal is cancelled
    event DealCancelled(
        uint256 indexed dealId,
        address indexed canceller
    );

    /// @notice Creates a new deal
    /// @param dealName The name/title of the deal
    /// @param requiredParties The number of parties required to participate
    /// @return The ID of the newly created deal
    function createDeal(
        string calldata dealName,
        uint256 requiredParties
    ) external returns (uint256) {
        require(requiredParties > 0, "At least one party required");
        require(requiredParties <= MAX_PARTIES_PER_DEAL, "Too many required parties");
        require(bytes(dealName).length > 0, "Deal name cannot be empty");
        require(bytes(dealName).length <= MAX_DEAL_NAME_LENGTH, "Deal name too long");

        uint256 dealId = dealCounter++;
        
        deals[dealId].dealName = dealName;
        deals[dealId].requiredParties = requiredParties;
        deals[dealId].createdAt = block.timestamp;
        deals[dealId].finalized = false;
        deals[dealId].cancelled = false;
        deals[dealId].creator = msg.sender;

        emit DealCreated(dealId, dealName, requiredParties, msg.sender);

        return dealId;
    }

    /// @notice Submits an encrypted offer for a deal
    /// @param dealId The ID of the deal
    /// @param inputEuint32 The encrypted offer value
    /// @param inputProof The proof for the encrypted input
    /// @param title The title of the offer
    /// @param description The description/terms of the offer
    function submitOffer(
        uint256 dealId,
        externalEuint32 inputEuint32,
        bytes calldata inputProof,
        string calldata title,
        string calldata description
    ) external {
        Deal storage deal = deals[dealId];
        
        require(!deal.finalized, "Deal already finalized");
        require(!deal.cancelled, "Deal has been cancelled");
        require(offers[dealId][msg.sender].party == address(0), "Offer already submitted");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(deal.parties.length < MAX_PARTIES_PER_DEAL, "Maximum parties reached");

        // Convert external encrypted input to internal euint32
        euint32 encryptedValue = FHE.fromExternal(inputEuint32, inputProof);

        // Store the offer
        offers[dealId][msg.sender] = Offer({
            party: msg.sender,
            encryptedValue: encryptedValue,
            title: title,
            description: description,
            timestamp: block.timestamp,
            revealed: false
        });

        // Add party to the deal's party list
        deal.parties.push(msg.sender);
        offerCount[dealId]++;

        // Track this deal for the party
        partyDeals[msg.sender].push(dealId);

        // Allow this contract to access the encrypted value
        FHE.allowThis(encryptedValue);
        // Allow the submitter to access their own encrypted value
        FHE.allow(encryptedValue, msg.sender);

        emit OfferSubmitted(dealId, msg.sender, title);
    }

    /// @notice Reveals the caller's offer for a deal
    /// @param dealId The ID of the deal
    function revealOffer(uint256 dealId) external {
        Offer storage offer = offers[dealId][msg.sender];
        
        require(offer.party == msg.sender, "No offer found for this address");
        require(!offer.revealed, "Offer already revealed");
        require(!deals[dealId].cancelled, "Deal has been cancelled");

        offer.revealed = true;

        emit OfferRevealed(dealId, msg.sender);
    }

    /// @notice Finalizes a deal after all offers are revealed
    /// @param dealId The ID of the deal
    function finalizeDeal(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        
        require(!deal.finalized, "Deal already finalized");
        require(!deal.cancelled, "Deal has been cancelled");
        require(areAllOffersRevealed(dealId), "Not all offers revealed");
        require(deal.parties.length > 0, "No offers submitted");

        deal.finalized = true;

        emit DealFinalized(dealId, block.timestamp);
    }

    /// @notice Cancels a deal (only the creator can cancel)
    /// @param dealId The ID of the deal
    function cancelDeal(uint256 dealId) external {
        Deal storage deal = deals[dealId];
        
        require(deal.creator == msg.sender, "Only creator can cancel deal");
        require(!deal.finalized, "Cannot cancel finalized deal");
        require(!deal.cancelled, "Deal already cancelled");

        deal.cancelled = true;

        emit DealCancelled(dealId, msg.sender);
    }

    /// @notice Checks if an address is the creator of a deal
    /// @param dealId The ID of the deal
    /// @param account The address to check
    /// @return Whether the account is the creator
    function isCreator(uint256 dealId, address account) external view returns (bool) {
        return deals[dealId].creator == account;
    }

    /// @notice Gets deal information
    /// @param dealId The ID of the deal
    /// @return dealName The name of the deal
    /// @return parties Array of party addresses
    /// @return requiredParties Number of required parties
    /// @return createdAt Timestamp when deal was created
    /// @return finalized Whether the deal is finalized
    /// @return cancelled Whether the deal is cancelled
    /// @return creator The address that created the deal
    function getDeal(uint256 dealId) external view returns (
        string memory dealName,
        address[] memory parties,
        uint256 requiredParties,
        uint256 createdAt,
        bool finalized,
        bool cancelled,
        address creator
    ) {
        Deal storage deal = deals[dealId];
        return (
            deal.dealName,
            deal.parties,
            deal.requiredParties,
            deal.createdAt,
            deal.finalized,
            deal.cancelled,
            deal.creator
        );
    }

    /// @notice Gets offer information by party address
    /// @param dealId The ID of the deal
    /// @param party The address of the party
    /// @return partyAddress The party's address
    /// @return encryptedValue The encrypted offer value handle
    /// @return timestamp When the offer was submitted
    /// @return revealed Whether the offer is revealed
    /// @return title The offer title
    /// @return description The offer description
    function getOfferByParty(uint256 dealId, address party) external view returns (
        address partyAddress,
        euint32 encryptedValue,
        uint256 timestamp,
        bool revealed,
        string memory title,
        string memory description
    ) {
        Offer storage offer = offers[dealId][party];
        return (
            offer.party,
            offer.encryptedValue,
            offer.timestamp,
            offer.revealed,
            offer.title,
            offer.description
        );
    }

    /// @notice Gets offer information (alternative signature for compatibility)
    /// @param dealId The ID of the deal
    /// @param party The address of the party
    /// @return partyAddress The party's address
    /// @return encryptedValue The encrypted offer value handle
    /// @return title The offer title
    /// @return description The offer description
    /// @return timestamp When the offer was submitted
    /// @return revealed Whether the offer is revealed
    function getOffer(uint256 dealId, address party) external view returns (
        address partyAddress,
        euint32 encryptedValue,
        string memory title,
        string memory description,
        uint256 timestamp,
        bool revealed
    ) {
        Offer storage offer = offers[dealId][party];
        return (
            offer.party,
            offer.encryptedValue,
            offer.title,
            offer.description,
            offer.timestamp,
            offer.revealed
        );
    }

    /// @notice Checks if all offers for a deal have been revealed
    /// @param dealId The ID of the deal
    /// @return Whether all offers are revealed
    function areAllOffersRevealed(uint256 dealId) public view returns (bool) {
        Deal storage deal = deals[dealId];
        
        if (deal.parties.length == 0) {
            return false;
        }

        for (uint256 i = 0; i < deal.parties.length; i++) {
            if (!offers[dealId][deal.parties[i]].revealed) {
                return false;
            }
        }

        return true;
    }

    /// @notice Gets the number of parties that have submitted offers
    /// @param dealId The ID of the deal
    /// @return The count of parties
    function getPartyCount(uint256 dealId) external view returns (uint256) {
        return deals[dealId].parties.length;
    }

    /// @notice Gets all deal IDs that a party has participated in
    /// @param party The address of the party
    /// @return An array of deal IDs
    function getDealsByParty(address party) external view returns (uint256[] memory) {
        return partyDeals[party];
    }

    /// @notice Gets the number of deals a party has participated in
    /// @param party The address of the party
    /// @return The count of deals
    function getPartyDealCount(address party) external view returns (uint256) {
        return partyDeals[party].length;
    }
}

