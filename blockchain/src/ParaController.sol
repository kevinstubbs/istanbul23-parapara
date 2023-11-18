// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ByteHasher} from "./helpers/ByteHasher.sol";
import {IWorldID} from "./interfaces/IWorldID.sol";

// TODO: Add reentrancy guards.
contract ParaController {
    using ByteHasher for bytes;

    struct Enrollment {
        address wallet;
        string alpha2country;
        bool isOrbVerified;
        bool isPhoneVerified;
        uint256 createdAt;
    }

    struct ReliefFund {
        bytes32 kekId;
        address organizer;
        string alpha2country;
        uint256 trancheAmount;
        bool isPaused;
        bool isStopped;
        uint256 fee;
        uint256 numTranchesReleased;
        uint256 createdAt;
    }

    struct TrancheClaim {
        bytes32 reliefFundKekId;
        uint256 trancheIndex;
        address claimer;
        uint256 claimedAt;
    }

    ///////////////////////////////////////////////////////////////////////////////
    ///                                  ERRORS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when attempting to reuse a nullifier
    error InvalidNullifier();

    /// @notice Thrown when attempting to modify a relief fund not organized by the sender
    error UnauthorizedReliefFundAccess();

    /// @notice Thrown when attempting to interact with a relief fund that is currently paused
    error ReliefFundAlreadyPaused();

    /// @notice Thrown when attempting to interact with a relief fund that has already been stopped
    error ReliefFundAlreadyStopped();

    /// @notice Thrown when attempting to claim a tranche from a wallet that is not entrolled
    error NotEnrolled();

    /// @notice Thrown when attempting to interact with a relief fund where the enrollee does not meet the fund's targeting properties
    error InelgibleForReliefFund();

    /// @notice Thrown when attempting to claim a tranche from a fund where you have already claimed all available tranches
    error AllTranchesAlreadyClaimed();

    /// @notice Thrown when a transfer fails
    error TransferFailed();

    /// @dev The World ID instance that will be used for verifying proofs
    IWorldID internal immutable worldId;

    /// @dev The contract's external nullifier hash
    uint256 internal immutable externalNullifier;

    /// @dev The World ID group ID (always 1)
    uint256 internal immutable groupId = 1;

    /// @dev Whether a nullifier hash has been used already. Used to guarantee an action is only performed once by a single person
    mapping(uint256 => address) internal nullifierHashes;
    mapping(address => Enrollment) internal enrollmentMap;

    mapping(bytes32 => ReliefFund) internal reliefFundMap;
    mapping(address => bytes32[]) internal controlledReliefFunds;
    mapping(bytes32 => mapping(address => TrancheClaim[]))
        internal trancheClaims;

    // It would be more efficient to track this off-chain, but we can do
    // this for hackathon time-constraint purposes.
    bytes32[] public allReliefFunds;

    ERC20 public usdc;

    mapping(bytes32 kekId => uint256) private _fundBalances;

    /// @param _worldId The WorldID instance that will verify the proofs
    /// @param _appId The World ID app ID
    /// @param _actionId The World ID action ID
    constructor(
        IWorldID _worldId,
        string memory _appId,
        string memory _actionId,
        address _usdc
    ) {
        worldId = _worldId;
        externalNullifier = abi
            .encodePacked(abi.encodePacked(_appId).hashToField(), _actionId)
            .hashToField();
        usdc = ERC20(_usdc);
    }

    /// @param signal An arbitrary input from the user, usually the user's wallet address (check README for further details)
    /// @param root The root of the Merkle tree (returned by the JS widget).
    /// @param nullifierHash The nullifier hash for this proof, preventing double signaling (returned by the JS widget).
    /// @param proof The zero-knowledge proof that demonstrates the claimer is registered with World ID (returned by the JS widget).
    /// @dev Feel free to rename this method however you want! We've used `claim`, `verify` or `execute` in the past.
    function verifyAndEnroll(
        Enrollment calldata signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) public {
        // First, we make sure this person hasn't done this before
        if (nullifierHashes[nullifierHash] != address(0))
            revert InvalidNullifier();

        // We now verify the provided proof is valid and the user is verified by World ID
        worldId.verifyProof(
            root,
            groupId,
            abi
                .encodePacked(
                    signal.wallet,
                    signal.alpha2country,
                    signal.isOrbVerified,
                    signal.isPhoneVerified,
                    signal.createdAt
                )
                .hashToField(),
            nullifierHash,
            externalNullifier,
            proof
        );

        // We now record the user has done this, so they can't do it again (proof of uniqueness)
        nullifierHashes[nullifierHash] = signal.wallet;
        enrollmentMap[signal.wallet] = signal;

        emit NewEnrollment(signal.wallet);
    }

    function createReliefFund(
        string calldata alpha2country,
        uint256 trancheAmount,
        uint256 fee
    ) public {
        bytes32 kekId = keccak256(
            abi.encodePacked(
                msg.sender,
                alpha2country,
                trancheAmount,
                block.timestamp
            )
        );

        ReliefFund memory newReliefFund = ReliefFund({
            kekId: kekId,
            organizer: msg.sender,
            alpha2country: alpha2country,
            trancheAmount: trancheAmount,
            isPaused: false,
            isStopped: false,
            fee: fee,
            numTranchesReleased: 0,
            createdAt: block.timestamp
        });

        reliefFundMap[kekId] = newReliefFund;
        controlledReliefFunds[msg.sender].push(kekId);
    }

    function pauseReliefFund(bytes32 kekId) public {
        if (reliefFundMap[kekId].organizer != msg.sender) {
            revert UnauthorizedReliefFundAccess();
        } else if (reliefFundMap[kekId].isStopped) {
            revert ReliefFundAlreadyStopped();
        }

        reliefFundMap[kekId].isPaused = true;
    }

    function resumeeliefFund(bytes32 kekId) public {
        if (reliefFundMap[kekId].organizer != msg.sender) {
            revert UnauthorizedReliefFundAccess();
        } else if (reliefFundMap[kekId].isStopped) {
            revert ReliefFundAlreadyStopped();
        }

        reliefFundMap[kekId].isPaused = false;
    }

    function stopReliefFund(bytes32 kekId) public {
        if (reliefFundMap[kekId].organizer != msg.sender) {
            revert UnauthorizedReliefFundAccess();
        } else if (reliefFundMap[kekId].isStopped) {
            revert ReliefFundAlreadyStopped();
        }

        reliefFundMap[kekId].isStopped = true;

        // TODO: Release unclaimed funds back to donors proportionally.
    }

    function startNextTranche(bytes32 kekId) public {
        if (reliefFundMap[kekId].organizer != msg.sender) {
            revert UnauthorizedReliefFundAccess();
        } else if (reliefFundMap[kekId].isStopped) {
            revert ReliefFundAlreadyStopped();
        }

        reliefFundMap[kekId].numTranchesReleased++;
    }

    function donateToReliefFund(bytes32 kekId, uint256 amount) public {
        if (reliefFundMap[kekId].isStopped) {
            revert ReliefFundAlreadyStopped();
        } else if (reliefFundMap[kekId].isPaused) {
            revert ReliefFundAlreadyPaused();
        }

        _fundBalances[kekId] += amount;

        if (!usdc.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }
    }

    function claimTranche(bytes32 kekId) public {
        if (reliefFundMap[kekId].isStopped) {
            revert ReliefFundAlreadyStopped();
        } else if (enrollmentMap[msg.sender].wallet == address(0)) {
            revert NotEnrolled();
        }
        // TODO: This is pretty hacky, have to figure out how to do the targeting in a more scalable/flexible way..
        // probably with oracles and/or chainlink in some way.
        else if (
            keccak256(
                abi.encodePacked(enrollmentMap[msg.sender].alpha2country)
            ) != keccak256(abi.encodePacked(reliefFundMap[kekId].alpha2country))
        ) {
            revert InelgibleForReliefFund();
        } else if (
            trancheClaims[kekId][msg.sender].length >=
            reliefFundMap[kekId].numTranchesReleased
        ) {
            revert AllTranchesAlreadyClaimed();
        }

        reliefFundMap[kekId].numTranchesReleased++;
        _fundBalances[kekId] -= reliefFundMap[kekId].trancheAmount;

        // TODO: Apply fund & platform's fees here.
        if (!usdc.transfer(msg.sender, reliefFundMap[kekId].trancheAmount)) {
            revert TransferFailed();
        }
    }

    function getAllReliefFunds() public view returns (ReliefFund[] memory) {
        uint len = allReliefFunds.length;
        ReliefFund[] memory hydratedReliefFunds = new ReliefFund[](len);

        for (uint i = 0; i < allReliefFunds.length; i++) {
            hydratedReliefFunds[i] = reliefFundMap[allReliefFunds[i]];
        }

        return hydratedReliefFunds;
    }

    function getReliefFunds(
        address organizer
    ) public view returns (ReliefFund[] memory) {
        uint len = controlledReliefFunds[organizer].length;
        ReliefFund[] memory hydratedReliefFunds = new ReliefFund[](len);

        for (uint i = 0; i < controlledReliefFunds[organizer].length; i++) {
            hydratedReliefFunds[i] = reliefFundMap[
                controlledReliefFunds[organizer][i]
            ];
        }

        return hydratedReliefFunds;
    }

    event NewEnrollment(address enrollee);
    event NewReliefFund(bytes32 kekId);
    event ReliefFundPaused(bytes32 kekId);
    event ReliefFundResumed(bytes32 kekId);
    event ReliefFundStopped(bytes32 kekId);
    event NextTrancheStarted(bytes32 kekId, uint256 trancheIndex);
    event TrancheClaimed(bytes32 kekId, uint256 trancheIndex, address claimer);
}
