// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is Ownable, ReentrancyGuard {
  using SafeERC20 for IERC20;

  uint16 public constant MAX_FEE_BPS = 1_000;
  uint16 public constant BPS_DENOMINATOR = 10_000;
  uint64 public constant AUTO_RELEASE_DELAY = 48 hours;

  IERC20 public immutable usdc;

  enum DealStatus {
    Created,
    Funded,
    Completed,
    Disputed,
    Resolved
  }

  struct Deal {
    address buyer;
    address seller;
    uint256 amount;
    uint256 fee;
    uint64 createdAt;
    uint64 deliveryDeadline;
    uint64 autoReleaseAt;
    string description;
    string channel;
    DealStatus status;
  }

  uint256 public nextDealId;
  uint16 public feeBps;
  uint256 public accruedFees;

  mapping(uint256 dealId => Deal deal) public deals;

  event DealCreated(
    uint256 indexed dealId,
    address indexed seller,
    address indexed buyer,
    uint256 amount,
    uint256 fee,
    uint64 deliveryDeadline,
    uint64 autoReleaseAt,
    string description,
    string channel
  );
  event DealFunded(uint256 indexed dealId, address indexed buyer, uint256 amount);
  event DeliveryConfirmed(uint256 indexed dealId, uint256 sellerAmount, uint256 fee);
  event DealAutoReleased(uint256 indexed dealId, uint256 sellerAmount, uint256 fee);
  event DisputeRaised(uint256 indexed dealId, address indexed raisedBy);
  event DisputeResolved(
    uint256 indexed dealId,
    uint256 buyerAmount,
    uint256 sellerAmount,
    uint256 fee
  );
  event FeesWithdrawn(address indexed recipient, uint256 amount);

  error InvalidAddress();
  error InvalidAmount();
  error InvalidDeadline();
  error InvalidFee();
  error InvalidResolution();
  error InvalidStatus();
  error Unauthorized();
  error AutoReleaseNotReady();

  constructor(address _usdc, address initialOwner, uint16 initialFeeBps) Ownable(initialOwner) {
    if (_usdc == address(0)) revert InvalidAddress();
    if (initialFeeBps > MAX_FEE_BPS) revert InvalidFee();

    usdc = IERC20(_usdc);
    feeBps = initialFeeBps;
  }

  function createDeal(
    address buyer,
    uint256 amount,
    uint64 deliveryDeadline,
    string calldata description,
    string calldata channel
  ) external returns (uint256 dealId) {
    if (buyer == address(0) || buyer == msg.sender) revert InvalidAddress();
    if (amount == 0) revert InvalidAmount();
    if (deliveryDeadline <= block.timestamp) revert InvalidDeadline();

    uint256 fee = (amount * feeBps) / BPS_DENOMINATOR;
    uint64 autoReleaseAt = deliveryDeadline + AUTO_RELEASE_DELAY;

    dealId = nextDealId++;
    deals[dealId] = Deal({
      buyer: buyer,
      seller: msg.sender,
      amount: amount,
      fee: fee,
      createdAt: uint64(block.timestamp),
      deliveryDeadline: deliveryDeadline,
      autoReleaseAt: autoReleaseAt,
      description: description,
      channel: channel,
      status: DealStatus.Created
    });

    emit DealCreated(
      dealId,
      msg.sender,
      buyer,
      amount,
      fee,
      deliveryDeadline,
      autoReleaseAt,
      description,
      channel
    );
  }

  function fundDeal(uint256 dealId) external nonReentrant {
    Deal storage deal = deals[dealId];
    if (deal.buyer != msg.sender) revert Unauthorized();
    if (deal.status != DealStatus.Created) revert InvalidStatus();
    if (block.timestamp > deal.deliveryDeadline) revert InvalidDeadline();

    deal.status = DealStatus.Funded;
    usdc.safeTransferFrom(msg.sender, address(this), deal.amount);

    emit DealFunded(dealId, msg.sender, deal.amount);
  }

  function confirmDelivery(uint256 dealId) external nonReentrant {
    Deal storage deal = deals[dealId];
    if (deal.buyer != msg.sender) revert Unauthorized();
    if (deal.status != DealStatus.Funded) revert InvalidStatus();

    (uint256 sellerAmount, uint256 fee) = _complete(deal);
    emit DeliveryConfirmed(dealId, sellerAmount, fee);
  }

  function autoRelease(uint256 dealId) external nonReentrant {
    Deal storage deal = deals[dealId];
    if (deal.status != DealStatus.Funded) revert InvalidStatus();
    if (block.timestamp < deal.autoReleaseAt) revert AutoReleaseNotReady();

    (uint256 sellerAmount, uint256 fee) = _complete(deal);
    emit DealAutoReleased(dealId, sellerAmount, fee);
  }

  function raiseDispute(uint256 dealId) external {
    Deal storage deal = deals[dealId];
    if (msg.sender != deal.buyer && msg.sender != deal.seller) revert Unauthorized();
    if (deal.status != DealStatus.Funded) revert InvalidStatus();

    deal.status = DealStatus.Disputed;
    emit DisputeRaised(dealId, msg.sender);
  }

  function resolveDispute(
    uint256 dealId,
    uint256 buyerAmount,
    uint256 sellerAmount
  ) external onlyOwner nonReentrant {
    Deal storage deal = deals[dealId];
    if (deal.status != DealStatus.Disputed) revert InvalidStatus();
    if (buyerAmount + sellerAmount + deal.fee != deal.amount) revert InvalidResolution();

    deal.status = DealStatus.Resolved;
    accruedFees += deal.fee;

    if (buyerAmount != 0) {
      usdc.safeTransfer(deal.buyer, buyerAmount);
    }
    if (sellerAmount != 0) {
      usdc.safeTransfer(deal.seller, sellerAmount);
    }

    emit DisputeResolved(dealId, buyerAmount, sellerAmount, deal.fee);
  }

  function withdrawFees(address recipient, uint256 amount) external onlyOwner nonReentrant {
    if (recipient == address(0)) revert InvalidAddress();
    if (amount == 0 || amount > accruedFees) revert InvalidAmount();

    accruedFees -= amount;
    usdc.safeTransfer(recipient, amount);

    emit FeesWithdrawn(recipient, amount);
  }

  function _complete(Deal storage deal) private returns (uint256 sellerAmount, uint256 fee) {
    deal.status = DealStatus.Completed;

    fee = deal.fee;
    sellerAmount = deal.amount - fee;
    accruedFees += fee;

    usdc.safeTransfer(deal.seller, sellerAmount);
  }
}
