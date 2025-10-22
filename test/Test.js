/ Import Hardhat toolbox utilities for network manipulation and fixture loading
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
// Import Hardhat chai matchers for event argument assertions
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
// Import chai expect for assertions
const { expect } = require("chai");
// Import Hardhat ethers for contract interactions
const { ethers } = require("hardhat");

// Test suite for ReaLiFi and RealifiFractionalToken contracts
describe("ReaLiFi and RealifiFractionalToken", function () {
  // Fixture to deploy contracts and set up initial state
  async function deployContractsFixture() {
    // Get test accounts: owner, seller, buyer, and otherAccount
    const [owner, seller, buyer, otherAccount] = await ethers.getSigners();

    // Deploy MockUSDC contract (6 decimals)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();

    // Deploy RealifiFractionalToken contract
    const RealifiFractionalToken = await ethers.getContractFactory("RealifiFractionalToken");
    const realifiFractionalToken = await RealifiFractionalToken.deploy();

    // Deploy ReaLiFi contract, linking RealifiFractionalToken and MockUSDC
    const ReaLiFi = await ethers.getContractFactory("ReaLiFi");
    const realifi = await ReaLiFi.deploy(realifiFractionalToken.target, usdc.target);

    // Authorize ReaLiFi to mint tokens in RealifiFractionalToken
    await realifiFractionalToken.setReaLiFi(realifi.target);

    // Add owner as admin
    await realifi.addAdmin(owner.address);

    // Mint 1 million USDC for seller, buyer, and otherAccount (6 decimals)
    const usdcAmount = ethers.parseUnits("1000000", 6); // 6 decimals
    await usdc.mint(seller.address, usdcAmount);
    await usdc.mint(buyer.address, usdcAmount);
    await usdc.mint(otherAccount.address, usdcAmount);

    // Approve ReaLiFi to spend USDC for test accounts
    await usdc.connect(seller).approve(realifi.target, usdcAmount);
    await usdc.connect(buyer).approve(realifi.target, usdcAmount);
    await usdc.connect(otherAccount).approve(realifi.target, usdcAmount);

    // Define test constants
    const assetPrice = ethers.parseUnits("1000", 6); // 1000 USDC
    const totalTokens = 100; // 100 fractional tokens
    const pricePerToken = assetPrice / BigInt(totalTokens); // 10 USDC per token
    const listingFeePercentage = 3; // 3% listing fee
    const cancellationPenaltyPercentage = 1; // 1% cancellation penalty
    const shareTradingFeePercentage = 2; // 2% share trading fee
    const percentageScale = ethers.parseEther("1"); // 1e18 for percentage calculations

    // Return fixture data for tests
    return {
      realifiFractionalToken,
      realifi,
      usdc,
      owner,
      seller,
      buyer,
      otherAccount,
      assetPrice,
      totalTokens,
      pricePerToken,
      listingFeePercentage,
      cancellationPenaltyPercentage,
      shareTradingFeePercentage,
      percentageScale,
    };
  }

  // Test suite for RealifiFractionalToken deployment
  describe("RealifiFractionalToken Deployment", function () {
    // Test that token name and symbol are set correctly
    it("Should set the right name and symbol", async function () {
      const { realifiFractionalToken } = await loadFixture(deployContractsFixture);
      expect(await realifiFractionalToken.name()).to.equal("RealifiFractionalToken");
      expect(await realifiFractionalToken.symbol()).to.equal("RFT");
    });

    // Test that the contract owner is set correctly
    it("Should set the right owner", async function () {
      const { realifiFractionalToken, owner } = await loadFixture(deployContractsFixture);
      expect(await realifiFractionalToken.owner()).to.equal(owner.address);
    });

    // Test that only the owner can set the ReaLiFi address
    it("Should allow owner to set ReaLiFi address", async function () {
      const { realifiFractionalToken, realifi, otherAccount } = await loadFixture(deployContractsFixture);
      // Non-owner should be reverted
      await expect(realifiFractionalToken.connect(otherAccount).setReaLiFi(otherAccount.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      // Owner should succeed
      await realifiFractionalToken.setReaLiFi(realifi.target);
      expect(await realifiFractionalToken.reaLiFi()).to.equal(realifi.target);
    });

    // Test authorized minting by owner and ReaLiFi, and unauthorized minting
    it("Should allow authorized minting", async function () {
      const { realifiFractionalToken, realifi, owner, seller, buyer, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      const amount = ethers.parseEther("100");

      // Owner can mint tokens
      await realifiFractionalToken.mint(buyer.address, amount);
      expect(await realifiFractionalToken.balanceOf(buyer.address)).to.equal(amount);

      // ReaLiFi can mint via fractionalization
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      expect(await realifiFractionalToken.balanceOf(realifi.target)).to.equal(totalTokens);

      // Non-authorized account cannot mint
      await expect(realifiFractionalToken.connect(buyer).mint(buyer.address, amount)).to.be.revertedWithCustomError(
        realifiFractionalToken,
        "NotAuthorized"
      );
    });
  });

  // Test suite for ReaLiFi deployment
  describe("ReaLiFi Deployment", function () {
    // Test that the contract owner is set correctly
    it("Should set the right owner", async function () {
      const { realifi, owner } = await loadFixture(deployContractsFixture);
      expect(await realifi.owner()).to.equal(owner.address);
    });

    // Test that token contract addresses are set correctly
    it("Should set the correct token contracts", async function () {
      const { realifi, realifiFractionalToken, usdc } = await loadFixture(deployContractsFixture);
      expect(await realifi.realEstateToken()).to.equal(realifiFractionalToken.target);
      expect(await realifi.usdcToken()).to.equal(usdc.target);
    });
  });

  // Test suite for seller registration
  describe("Seller Registration", function () {
    // Test that a seller can register
    it("Should allow seller to register", async function () {
      const { realifi, seller } = await loadFixture(deployContractsFixture);

      // Register seller and verify event
      await expect(realifi.connect(seller).registerSeller())
        .to.emit(realifi, "SellerRegistered")
        .withArgs(seller.address);

      // Verify seller is registered
      expect(await realifi.sellers(seller.address)).to.be.true;
    });

    // Test that a registered seller cannot register again
    it("Should revert if seller is already registered", async function () {
      const { realifi, seller } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await expect(realifi.connect(seller).registerSeller()).to.be.revertedWithCustomError(
        realifi,
        "SellerAlreadyRegistered"
      );
    });
  });

  // Test suite for asset creation
  describe("Asset Creation", function () {
    // Test that a registered seller can create an asset
    it("Should allow registered seller to create an asset", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();

      const tokenURI = "ipfs://token1";

      // Create asset and verify event
      await expect(realifi.connect(seller).createAsset(tokenURI, assetPrice))
        .to.emit(realifi, "AssetCreated")
        .withArgs(1, assetPrice, seller.address, false);

      // Verify asset data
      const asset = await realifi.fetchAsset(1);
      expect(asset.tokenId).to.equal(1);
      expect(asset.price).to.equal(assetPrice);
      expect(asset.seller).to.equal(seller.address);
      expect(asset.sold).to.be.false;
      expect(asset.verified).to.be.false;
    });

    // Test that an unregistered seller cannot create an asset
    it("Should revert if seller is not registered", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await expect(
        realifi.connect(seller).createAsset("ipfs://token1", assetPrice)
      ).to.be.revertedWithCustomError(realifi, "SellerNotRegistered");
    });

    // Test that an asset cannot have a zero price
    it("Should revert if price is zero", async function () {
      const { realifi, seller } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await expect(
        realifi.connect(seller).createAsset("ipfs://token1", 0)
      ).to.be.revertedWithCustomError(realifi, "InvalidPrice");
    });
  });

  // Test suite for asset verification
  describe("Asset Verification", function () {
    // Test that an admin can verify an asset
    it("Should allow admin to verify an asset", async function () {
      const { realifi, owner, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);

      // Verify asset and check event
      await expect(realifi.verifyAsset(1))
        .to.emit(realifi, "AssetVerified")
        .withArgs(1, seller.address);

      // Verify asset state
      const asset = await realifi.fetchAsset(1);
      expect(asset.verified).to.be.true;
    });

    // Test that verifying a non-existent asset reverts
    it("Should revert if asset does not exist", async function () {
      const { realifi } = await loadFixture(deployContractsFixture);
      await expect(realifi.verifyAsset(1)).to.be.revertedWithCustomError(realifi, "AssetDoesNotExist");
    });

    // Test that verifying an already verified asset reverts
    it("Should revert if asset is already verified", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await expect(realifi.verifyAsset(1)).to.be.revertedWithCustomError(realifi, "AssetAlreadyVerified");
    });

    // Test that non-admin cannot verify assets
    it("Should revert if non-admin tries to verify asset", async function () {
      const { realifi, seller, buyer, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      
      await expect(realifi.connect(buyer).verifyAsset(1))
        .to.be.revertedWithCustomError(realifi, "NotAdmin");
    });
  });

  // Test suite for asset fractionalization
  describe("Fractionalization", function () {
    // Test that an admin can fractionalize a verified asset
    it("Should allow admin to fractionalize a verified asset", async function () {
      const { realifi, seller, totalTokens, assetPrice, pricePerToken } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);

      // Create fractional asset and verify event
      await expect(realifi.createFractionalAsset(1, totalTokens))
        .to.emit(realifi, "FractionalAssetCreated")
        .withArgs(1, totalTokens, pricePerToken, seller.address);

      // Verify fractional asset data
      const fractionalAsset = await realifi.fractionalAssets(1);
      expect(fractionalAsset.totalTokens).to.equal(totalTokens);
      expect(fractionalAsset.pricePerToken).to.equal(pricePerToken);
    });

    // Test that fractionalizing an unverified asset reverts
    it("Should revert if asset is not verified", async function () {
      const { realifi, seller, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await expect(realifi.createFractionalAsset(1, totalTokens)).to.be.revertedWithCustomError(
        realifi,
        "AssetNotVerified"
      );
    });
  });

  // Test suite for fractional asset purchases
  describe("Fractional Purchases", function () {
    // Test that a buyer can purchase fractional tokens
    it("Should allow buyer to purchase fractional tokens", async function () {
      const { realifi, realifiFractionalToken, usdc, seller, buyer, totalTokens, assetPrice, pricePerToken } =
        await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      const numTokens = 10;
      const totalPrice = pricePerToken * BigInt(numTokens); // 100 USDC

      // Purchase fractional tokens and verify event
      await expect(realifi.connect(buyer).buyFractionalAsset(1, numTokens))
        .to.emit(realifi, "FractionalAssetPurchased")
        .withArgs(1, buyer.address, numTokens, totalPrice);

      // Verify token and USDC balances
      expect(await realifiFractionalToken.balanceOf(buyer.address)).to.equal(numTokens);
      expect(await usdc.balanceOf(realifi.target)).to.equal(totalPrice);
      expect(await realifi.getFractionalPayments(1)).to.equal(totalPrice);
    });

    // Test that purchasing more tokens than available reverts
    it("Should revert if insufficient tokens", async function () {
      const { realifi, seller, buyer, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      await expect(realifi.connect(buyer).buyFractionalAsset(1, totalTokens + 1)).to.be.revertedWithCustomError(
        realifi,
        "InsufficientTokens"
      );
    });
  });

  // Test suite for dividend distribution to fractional buyers
  describe("Dividend Distribution", function () {
    // Test that dividends are distributed correctly to fractional buyers
    it("Should distribute dividends to fractional buyers", async function () {
      const { realifi, usdc, seller, buyer, totalTokens, assetPrice, pricePerToken } = await loadFixture(
        deployContractsFixture
      );
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      // Buyer purchases 10 fractional tokens
      const numTokens = 10;
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);

      // Deposit 100 USDC for dividends
      const dividendAmount = ethers.parseUnits("100", 6); // 100 USDC
      await usdc.mint(realifi.target, dividendAmount);

      // Calculate expected dividend share (10/100 * 100 USDC = 10 USDC)
      const expectedShare = (dividendAmount * BigInt(numTokens)) / BigInt(totalTokens);

      // Distribute dividends and verify event
      await expect(realifi.distributeFractionalDividends(1, dividendAmount))
        .to.emit(realifi, "FractionalDividendsDistributed")
        .withArgs(1, dividendAmount, [buyer.address], [expectedShare]);

      // Verify buyer's USDC balance (initial - purchase + dividend)
      expect(await usdc.balanceOf(buyer.address)).to.equal(ethers.parseUnits("1000000", 6) - pricePerToken * BigInt(numTokens) + expectedShare);
    });

    // Test that distributing dividends with insufficient USDC reverts
    it("Should revert if insufficient USDC balance", async function () {
      const { realifi, seller, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      await expect(realifi.distributeFractionalDividends(1, ethers.parseUnits("100", 6))).to.be.revertedWithCustomError(
        realifi,
        "InsufficientUSDCBalance"
      );
    });
  });

  // Test suite for full asset purchases
  describe("Asset Purchase", function () {
    // Test that a buyer can purchase and confirm payment for an asset
    it("Should allow buyer to purchase an asset", async function () {
      const { realifi, usdc, seller, buyer, assetPrice, listingFeePercentage } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);

      // Purchase asset and verify event
      await expect(realifi.connect(buyer).buyAsset(1))
        .to.emit(realifi, "AssetPurchased")
        .withArgs(1, buyer.address, assetPrice);

      // Confirm payment and verify event
      await expect(realifi.connect(buyer).confirmAssetPayment(1))
        .to.emit(realifi, "AssetPaymentConfirmed")
        .withArgs(1, buyer.address);

      // Calculate listing fee (3% of 1000 USDC = 30 USDC)
      const listingFee = (assetPrice * BigInt(listingFeePercentage)) / BigInt(100);
      const initialSellerBalance = ethers.parseUnits("1000000", 6);

      // Verify seller receives payment minus fee
      expect(await usdc.balanceOf(seller.address)).to.equal(initialSellerBalance + (assetPrice - listingFee));
      // Verify buyer owns the asset
      expect(await realifi.ownerOf(1)).to.equal(buyer.address);
    });

    // Test that fractional payments are tracked correctly
    it("Should track fractional payments correctly", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      const numTokens = 10;
      const totalPrice = (assetPrice / BigInt(totalTokens)) * BigInt(numTokens); // 100 USDC
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);
      expect(await realifi.getFractionalPayments(1)).to.equal(totalPrice);
    });

    // Test that purchasing an unverified asset reverts
    it("Should revert if asset is not verified", async function () {
      const { realifi, seller, buyer, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await expect(realifi.connect(buyer).buyAsset(1)).to.be.revertedWithCustomError(realifi, "AssetNotVerified");
    });
  });

  // Test suite for asset delisting
  describe("Delisting", function () {
    // Test that an admin can delist an asset
    it("Should allow admin to delist an asset", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);

      // Delist asset and verify event
      await expect(realifi.delistAsset(1))
        .to.emit(realifi, "AssetDelisted")
        .withArgs(1, seller.address);

      // Verify asset is removed
      const asset = await realifi.fetchAsset(1);
      expect(asset.seller).to.equal(ethers.ZeroAddress);
    });

    // Test that delisting an asset with fractional buyers reverts
    it("Should revert if asset has fractional buyers", async function () {
      const { realifi, seller, buyer, totalTokens, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.delistAsset(1)).to.be.revertedWithCustomError(realifi, "FractionalizedAssetWithBuyers");
    });
  });

  // Test suite for USDC withdrawals
  describe("Withdrawals", function () {
    // Test that the owner can withdraw USDC from fractional purchases
    it("Should allow owner to withdraw USDC", async function () {
      const { realifi, usdc, owner, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      const numTokens = 10;
      const totalPrice = (assetPrice / BigInt(totalTokens)) * BigInt(numTokens); // 100 USDC

      // Buyer purchases fractional tokens
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);

      // Owner withdraws USDC and verify event
      await expect(realifi.withdrawUSDC(owner.address, totalPrice))
        .to.emit(realifi, "USDCWithdrawn")
        .withArgs(owner.address, totalPrice);

      // Verify owner's USDC balance
      expect(await usdc.balanceOf(owner.address)).to.equal(totalPrice);
    });

    // Test that withdrawing with insufficient USDC balance reverts
    it("Should revert if insufficient USDC balance", async function () {
      const { realifi, owner } = await loadFixture(deployContractsFixture);
      await expect(realifi.withdrawUSDC(owner.address, ethers.parseUnits("100", 6))).to.be.revertedWithCustomError(
        realifi,
        "InsufficientUSDCBalance"
      );
    });
  });

  // Test suite for MockUSDC contract
  describe("MockUSDC", function () {
    // Test that MockUSDC has 6 decimals
    it("Should return correct decimals", async function () {
      const { usdc } = await loadFixture(deployContractsFixture);
      expect(await usdc.decimals()).to.equal(6);
    });
  });

  // Test suite for asset purchase cancellation
  describe("Asset Purchase Cancellation", function () {
    // Test that a buyer can cancel an asset purchase with a penalty
    it("Should allow buyer to cancel asset purchase with penalty", async function () {
      const { realifi, usdc, seller, buyer, owner, assetPrice, cancellationPenaltyPercentage } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.connect(buyer).buyAsset(1);

      const penalty = (assetPrice * BigInt(cancellationPenaltyPercentage)) / BigInt(100); // 10 USDC
      const refunded = assetPrice - penalty; // 990 USDC
      const initialBuyerBalance = await usdc.balanceOf(buyer.address); // After buy: 999,000 USDC
      const initialOwnerBalance = await usdc.balanceOf(owner.address);

      // Cancel purchase
      await realifi.connect(buyer).cancelAssetPurchase(1);

      // Verify balances: buyer gets refunded amount, owner gets penalty
      expect(await usdc.balanceOf(buyer.address)).to.equal(initialBuyerBalance + refunded);
      expect(await usdc.balanceOf(owner.address)).to.equal(initialOwnerBalance + penalty);
    });

    // Test that only the buyer can cancel the purchase
    it("Should revert if not buyer cancels asset purchase", async function () {
      const { realifi, seller, buyer, otherAccount, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.connect(buyer).buyAsset(1);

      // Non-buyer should be reverted
      await expect(realifi.connect(otherAccount).cancelAssetPurchase(1)).to.be.revertedWithCustomError(
        realifi,
        "NotBuyer"
      );
    });
  });

  // Test suite for admin management
  describe("Admin Management", function () {
    it("Should allow owner to add admin", async function () {
      const { realifi, owner, otherAccount } = await loadFixture(deployContractsFixture);
      
      await realifi.addAdmin(otherAccount.address);
      expect(await realifi.isAdmin(otherAccount.address)).to.be.true;
    });

    it("Should allow owner to remove admin", async function () {
      const { realifi, owner, otherAccount } = await loadFixture(deployContractsFixture);
      
      await realifi.addAdmin(otherAccount.address);
      await realifi.removeAdmin(otherAccount.address);
      expect(await realifi.isAdmin(otherAccount.address)).to.be.false;
    });
  });

  // Test suite for fetching listed assets
  describe("Asset Listing", function () {
    // Test that fetchAllListedAssets returns correct asset data
    it("Should return correct listed assets", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);

      // Fetch listed assets
      const assets = await realifi.fetchAllListedAssets();
      expect(assets.length).to.equal(1);
      expect(assets[0].price).to.equal(assetPrice);
      expect(assets[0].seller).to.equal(seller.address);
    });

    // Test that fetchAllListedAssets returns an empty list when no assets are listed
    it("Should return empty list when no assets are listed", async function () {
      const { realifi } = await loadFixture(deployContractsFixture);
      const assets = await realifi.fetchAllListedAssets();
      expect(assets.length).to.equal(0);
    });

    // Test that fetchAllListedAssets handles multiple assets
    it("Should return multiple listed assets", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.connect(seller).createAsset("ipfs://token2", assetPrice);
      const assets = await realifi.fetchAllListedAssets();
      expect(assets.length).to.equal(2);
    });
  });

  // Test suite for new getter functions
  describe("Getter Functions", function () {
    it("Should return asset display info", async function () {
      const { realifi, seller, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      const displayInfo = await realifi.getAssetDisplayInfo(1);
      expect(displayInfo.tokenId).to.equal(1);
      expect(displayInfo.price).to.equal(assetPrice);
      expect(displayInfo.seller).to.equal(seller.address);
      expect(displayInfo.verified).to.be.true;
      expect(displayInfo.isFractionalized).to.be.true;
      expect(displayInfo.totalFractionalTokens).to.equal(totalTokens);
    });

    it("Should fetch available assets", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);

      const availableAssets = await realifi.fetchAvailableAssets();
      expect(availableAssets.length).to.equal(1);
      expect(availableAssets[0].tokenId).to.equal(1);
    });

    it("Should fetch fractionalized assets", async function () {
      const { realifi, seller, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      const fractionalAssets = await realifi.fetchFractionalizedAssets();
      expect(fractionalAssets.length).to.equal(1);
      expect(fractionalAssets[0].isFractionalized).to.be.true;
    });

    it("Should fetch buyer portfolio", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      const portfolio = await realifi.getBuyerPortfolio(buyer.address);
      expect(portfolio.length).to.equal(1);
      expect(portfolio[0].tokenId).to.equal(1);
      expect(portfolio[0].fractionalTokensOwned).to.equal(10);
    });

    it("Should fetch seller assets", async function () {
      const { realifi, seller, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.connect(seller).createAsset("ipfs://token2", assetPrice);

      const sellerAssets = await realifi.getSellerAssets(seller.address);
      expect(sellerAssets.length).to.equal(2);
    });

    it("Should return seller metrics", async function () {
      const { realifi, seller, buyer, assetPrice } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.connect(buyer).buyAsset(1);
      await realifi.connect(buyer).confirmAssetPayment(1);

      const [confirmed, canceled] = await realifi.getSellerMetrics(seller.address);
      expect(confirmed).to.equal(1);
      expect(canceled).to.equal(0);
    });

    it("Should return fractional asset buyers list", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      const buyers = await realifi.getFractionalAssetBuyersList(1);
      expect(buyers.length).to.equal(1);
      expect(buyers[0]).to.equal(buyer.address);
    });
  });

  // Test suite for fractional asset cancellation
  describe("Fractional Asset Purchase Cancellation", function () {
    it("Should allow buyer to cancel fractional purchase when enabled", async function () {
      const { realifi, realifiFractionalToken, usdc, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      const numTokens = 10;
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Enable withdrawal for this asset
      await realifi.setBuyerCanWithdraw(1, true);
      
      const buyerBalanceBefore = await usdc.balanceOf(buyer.address);
      const pricePerToken = assetPrice / BigInt(totalTokens);
      const refundAmount = pricePerToken * BigInt(numTokens);

      // Approve tokens back to contract
      await realifiFractionalToken.connect(buyer).approve(realifi.target, numTokens);
      
      await expect(realifi.connect(buyer).cancelFractionalAssetPurchase(1, numTokens))
        .to.emit(realifi, "AssetCanceled")
        .withArgs(1, buyer.address);

      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalanceBefore + refundAmount);
      expect(await realifi.getBuyerFractions(buyer.address, 1)).to.equal(0);
    });

    it("Should revert if buyer cannot withdraw yet", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.connect(buyer).cancelFractionalAssetPurchase(1, 10))
        .to.be.revertedWithCustomError(realifi, "CannotWithdrawYet");
    });

    it("Should allow admin to set buyer withdrawal permission", async function () {
      const { realifi, seller, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);

      await realifi.setBuyerCanWithdraw(1, true);
      expect(await realifi.buyerCanWithdraw(1)).to.be.true;

      await realifi.setBuyerCanWithdraw(1, false);
      expect(await realifi.buyerCanWithdraw(1)).to.be.false;
    });

    it("Should revert if buyer has no tokens to cancel", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      await realifi.setBuyerCanWithdraw(1, true);

      await expect(realifi.connect(buyer).cancelFractionalAssetPurchase(1, 10))
        .to.be.revertedWithCustomError(realifi, "NoTokensOwned");
    });

    it("Should revert if buyer tries to cancel more tokens than owned", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      const numTokens = 10;
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);
      
      await realifi.setBuyerCanWithdraw(1, true);
      
      // Approve tokens back to contract
      await realifiFractionalToken.connect(buyer).approve(realifi.target, numTokens + 5);
      
      await expect(realifi.connect(buyer).cancelFractionalAssetPurchase(1, numTokens + 5))
        .to.be.revertedWithCustomError(realifi, "NotEnoughTokensOwned");
    });
  });

  // Test suite for share transfer functionality
  describe("Share Transfer", function () {
    it("Should allow user to transfer shares to another address", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Approve transfer
      await realifiFractionalToken.connect(buyer).approve(realifi.target, numTokens);
      
      const sharesToTransfer = 10;
      await expect(realifi.connect(buyer).transferShares(1, otherAccount.address, sharesToTransfer))
        .to.emit(realifi, "SharesTransferred")
        .withArgs(1, buyer.address, otherAccount.address, sharesToTransfer);
      
      expect(await realifi.getBuyerFractions(buyer.address, 1)).to.equal(numTokens - sharesToTransfer);
      expect(await realifi.getBuyerFractions(otherAccount.address, 1)).to.equal(sharesToTransfer);
      expect(await realifiFractionalToken.balanceOf(otherAccount.address)).to.equal(sharesToTransfer);
    });

    it("Should revert if transferring to zero address", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.connect(buyer).transferShares(1, ethers.ZeroAddress, 5))
        .to.be.revertedWithCustomError(realifi, "InvalidRecipient");
    });

    it("Should revert if transferring to self", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.connect(buyer).transferShares(1, buyer.address, 5))
        .to.be.revertedWithCustomError(realifi, "InvalidRecipient");
    });

    it("Should revert if transferring more shares than owned", async function () {
      const { realifi, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.connect(buyer).transferShares(1, otherAccount.address, 15))
        .to.be.revertedWithCustomError(realifi, "NotEnoughTokensOwned");
    });
  });

  // Test suite for listing shares for sale
  describe("List Shares For Sale", function () {
    it("Should allow user to list shares for sale", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Approve transfer to contract for escrow
      await realifiFractionalToken.connect(buyer).approve(realifi.target, numTokens);
      
      const sharesToList = 10;
      const pricePerShare = ethers.parseUnits("12", 6); // 12 USDC per share
      
      await expect(realifi.connect(buyer).listSharesForSale(1, sharesToList, pricePerShare))
        .to.emit(realifi, "SharesListed")
        .withArgs(1, 1, buyer.address, sharesToList, pricePerShare);
      
      const listing = await realifi.shareListings(1);
      expect(listing.tokenId).to.equal(1);
      expect(listing.seller).to.equal(buyer.address);
      expect(listing.numShares).to.equal(sharesToList);
      expect(listing.pricePerShare).to.equal(pricePerShare);
      expect(listing.active).to.be.true;
      
      // Shares should be in escrow
      expect(await realifiFractionalToken.balanceOf(realifi.target)).to.equal(totalTokens - (numTokens - sharesToList));
    });

    it("Should revert if listing zero shares", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.connect(buyer).listSharesForSale(1, 0, ethers.parseUnits("10", 6)))
        .to.be.revertedWithCustomError(realifi, "InvalidAmount");
    });

    it("Should revert if price per share is zero", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.connect(buyer).listSharesForSale(1, 5, 0))
        .to.be.revertedWithCustomError(realifi, "InvalidPrice");
    });

    it("Should revert if listing more shares than owned", async function () {
      const { realifi, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.connect(buyer).buyFractionalAsset(1, 10);

      await expect(realifi.connect(buyer).listSharesForSale(1, 15, ethers.parseUnits("10", 6)))
        .to.be.revertedWithCustomError(realifi, "NotEnoughTokensOwned");
    });
  });

  // Test suite for buying listed shares
  describe("Buy Listed Shares", function () {
    it("Should allow user to buy listed shares", async function () {
      const { realifi, realifiFractionalToken, usdc, seller, buyer, otherAccount, owner, assetPrice, totalTokens, shareTradingFeePercentage } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);
      
      // Approve and list shares
      await realifiFractionalToken.connect(buyer).approve(realifi.target, numTokens);
      const sharesToList = 10;
      const pricePerShare = ethers.parseUnits("12", 6);
      await realifi.connect(buyer).listSharesForSale(1, sharesToList, pricePerShare);
      
      const totalPrice = pricePerShare * BigInt(sharesToList);
      const tradingFee = (totalPrice * BigInt(shareTradingFeePercentage)) / BigInt(100);
      const sellerPayment = totalPrice - tradingFee;
      
      const buyerBalanceBefore = await usdc.balanceOf(buyer.address);
      const otherAccountBalanceBefore = await usdc.balanceOf(otherAccount.address);
      const ownerBalanceBefore = await usdc.balanceOf(owner.address);
      
      await expect(realifi.connect(otherAccount).buyListedShares(1))
        .to.emit(realifi, "SharesPurchased")
        .withArgs(1, 1, otherAccount.address, buyer.address, sharesToList, totalPrice);
      
      // Verify balances
      expect(await usdc.balanceOf(buyer.address)).to.equal(buyerBalanceBefore + sellerPayment);
      expect(await usdc.balanceOf(otherAccount.address)).to.equal(otherAccountBalanceBefore - totalPrice);
      expect(await usdc.balanceOf(owner.address)).to.equal(ownerBalanceBefore + tradingFee);
      
      // Verify share ownership
      expect(await realifi.getBuyerFractions(buyer.address, 1)).to.equal(numTokens - sharesToList);
      expect(await realifi.getBuyerFractions(otherAccount.address, 1)).to.equal(sharesToList);
      expect(await realifiFractionalToken.balanceOf(otherAccount.address)).to.equal(sharesToList);
      
      // Verify listing is inactive
      const listing = await realifi.shareListings(1);
      expect(listing.active).to.be.false;
    });

    it("Should revert if listing does not exist", async function () {
      const { realifi, buyer } = await loadFixture(deployContractsFixture);
      
      await expect(realifi.connect(buyer).buyListedShares(999))
        .to.be.revertedWithCustomError(realifi, "ShareListingNotFound");
    });

    it("Should revert if listing is not active", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      await realifi.connect(buyer).buyFractionalAsset(1, 20);
      await realifiFractionalToken.connect(buyer).approve(realifi.target, 20);
      await realifi.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      // Buy the shares (makes listing inactive)
      await realifi.connect(otherAccount).buyListedShares(1);
      
      // Try to buy again
      await expect(realifi.connect(otherAccount).buyListedShares(1))
        .to.be.revertedWithCustomError(realifi, "ShareListingNotActive");
    });

    it("Should revert if buyer tries to buy own shares", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      await realifi.connect(buyer).buyFractionalAsset(1, 20);
      await realifiFractionalToken.connect(buyer).approve(realifi.target, 20);
      await realifi.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      await expect(realifi.connect(buyer).buyListedShares(1))
        .to.be.revertedWithCustomError(realifi, "CannotBuyOwnShares");
    });
  });

  // Test suite for canceling share listings
  describe("Cancel Share Listing", function () {
    it("Should allow seller to cancel share listing", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      const numTokens = 20;
      await realifi.connect(buyer).buyFractionalAsset(1, numTokens);
      
      await realifiFractionalToken.connect(buyer).approve(realifi.target, numTokens);
      const sharesToList = 10;
      const pricePerShare = ethers.parseUnits("12", 6);
      await realifi.connect(buyer).listSharesForSale(1, sharesToList, pricePerShare);
      
      const buyerBalanceBefore = await realifiFractionalToken.balanceOf(buyer.address);
      
      await expect(realifi.connect(buyer).cancelShareListing(1))
        .to.emit(realifi, "ShareListingCanceled")
        .withArgs(1, 1, buyer.address);
      
      // Shares returned to seller
      expect(await realifiFractionalToken.balanceOf(buyer.address)).to.equal(buyerBalanceBefore + BigInt(sharesToList));
      
      // Listing is inactive
      const listing = await realifi.shareListings(1);
      expect(listing.active).to.be.false;
    });

    it("Should revert if not the seller tries to cancel", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      await realifi.connect(buyer).buyFractionalAsset(1, 20);
      await realifiFractionalToken.connect(buyer).approve(realifi.target, 20);
      await realifi.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      await expect(realifi.connect(otherAccount).cancelShareListing(1))
        .to.be.revertedWithCustomError(realifi, "NotShareSeller");
    });

    it("Should revert if listing is already inactive", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      await realifi.connect(buyer).buyFractionalAsset(1, 20);
      await realifiFractionalToken.connect(buyer).approve(realifi.target, 20);
      await realifi.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      await realifi.connect(buyer).cancelShareListing(1);
      
      await expect(realifi.connect(buyer).cancelShareListing(1))
        .to.be.revertedWithCustomError(realifi, "ShareListingNotActive");
    });
  });

  // Test suite for getting share listings
  describe("Get Share Listings", function () {
    it("Should return all active share listings for an asset", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      // Two buyers purchase and list shares
      await realifi.connect(buyer).buyFractionalAsset(1, 30);
      await realifi.connect(otherAccount).buyFractionalAsset(1, 20);
      
      await realifiFractionalToken.connect(buyer).approve(realifi.target, 30);
      await realifiFractionalToken.connect(otherAccount).approve(realifi.target, 20);
      
      await realifi.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      await realifi.connect(otherAccount).listSharesForSale(1, 15, ethers.parseUnits("11", 6));
      
      const listings = await realifi.getAssetShareListings(1);
      expect(listings.length).to.equal(2);
      expect(listings[0].numShares).to.equal(10);
      expect(listings[1].numShares).to.equal(15);
    });

    it("Should return all active share listings across all assets", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.connect(seller).createAsset("ipfs://token2", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.verifyAsset(2);
      await realifi.createFractionalAsset(1, totalTokens);
      await realifi.createFractionalAsset(2, totalTokens);
      
      await realifi.connect(buyer).buyFractionalAsset(1, 20);
      await realifi.connect(buyer).buyFractionalAsset(2, 15);
      
      await realifiFractionalToken.connect(buyer).approve(realifi.target, 35);
      
      await realifi.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      await realifi.connect(buyer).listSharesForSale(2, 5, ethers.parseUnits("15", 6));
      
      const allListings = await realifi.getAllActiveShareListings();
      expect(allListings.length).to.equal(2);
    });

    it("Should not return inactive listings", async function () {
      const { realifi, realifiFractionalToken, seller, buyer, otherAccount, assetPrice, totalTokens } = await loadFixture(deployContractsFixture);
      await realifi.connect(seller).registerSeller();
      await realifi.connect(seller).createAsset("ipfs://token1", assetPrice);
      await realifi.verifyAsset(1);
      await realifi.createFractionalAsset(1, totalTokens);
      
      await realifi.connect(buyer).buyFractionalAsset(1, 30);
      await realifiFractionalToken.connect(buyer).approve(realifi.target, 30);
      await realifi.connect(buyer).listSharesForSale(1, 10, ethers.parseUnits("12", 6));
      
      // Cancel the listing
      await realifi.connect(buyer).cancelShareListing(1);
      
      const listings = await realifi.getAssetShareListings(1);
      expect(listings.length).to.equal(0);
    });
  });
});
