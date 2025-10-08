// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./RealifiFractionalToken.sol";

/// @title RealEstateDApp
/// @author Therock Ani
/// @notice A decentralized application for trading real estate assets as NFTs with fractional ownership and dividend distribution.
contract ReaLiFi is Ownable, ERC721URIStorage, ERC721Holder, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeERC20 for RealifiFractionalToken;

    // --- Constants ---
    uint256 public constant LISTING_FEE_PERCENTAGE = 3;
    uint256 public constant CANCELLATION_PENALTY_PERCENTAGE = 1;
    uint256 private constant PERCENTAGE_DENOMINATOR = 100;
    uint256 private constant PERCENTAGE_SCALE = 1e18;
    uint256 private constant START_TOKEN_ID = 1;
    uint256 private constant ZERO_AMOUNT = 0;
    address private constant ZERO_ADDRESS = address(0);

    // --- State Variables ---
    uint256 private _tokenIds;
    RealifiFractionalToken public immutable realEstateToken;
    IERC20 public immutable usdcToken;

    // PUBLIC mappings for direct UI access
    mapping(uint256 => RealEstateAsset) public realEstateAssets;
    mapping(address => bool) public sellers;
    mapping(uint256 => FractionalAsset) public fractionalAssets;
    mapping(address => bool) public isAdmin;

    // PRIVATE mappings with getter functions
    mapping(address => uint256) private sellerConfirmedPurchases;
    mapping(address => uint256) private sellerCanceledPurchases;
    mapping(uint256 => bool) private assetPaidFor;
    mapping(uint256 => address payable) private assetBuyers;
    mapping(uint256 => bool) private assetCanceled;
    mapping(address => mapping(uint256 => uint256)) private buyerFractions;
    mapping(uint256 => address[]) private fractionalAssetBuyers;
    mapping(uint256 => uint256) private fractionalPayments;

    // --- Structs ---
    struct RealEstateAsset {
        uint256 tokenId;
        uint256 price;
        address payable seller;
        bool sold;
        bool verified;
    }

    struct FractionalAsset {
        uint256 tokenId;
        uint256 totalTokens;
        uint256 pricePerToken;
        address payable seller;
    }

    struct FractionalBuyer {
        address buyer;
        uint256 numTokens;
        uint256 percentage;
    }

    /// @notice Extended asset info for UI display
    struct AssetDisplayInfo {
        uint256 tokenId;
        uint256 price;
        address seller;
        bool sold;
        bool verified;
        bool isPaidFor;
        bool isCanceled;
        address currentBuyer;
        string tokenURI;
        bool isFractionalized;
        uint256 totalFractionalTokens;
        uint256 remainingFractionalTokens;
        uint256 pricePerFractionalToken;
        uint256 accumulatedFractionalPayments;
    }

    /// @notice Buyer's portfolio item
    struct BuyerPortfolio {
        uint256 tokenId;
        uint256 fractionalTokensOwned;
        uint256 ownershipPercentage;
        uint256 investmentValue;
    }

    // --- Custom Errors ---
    error SellerAlreadyRegistered();
    error SellerNotRegistered();
    error InvalidPrice();
    error AssetDoesNotExist();
    error AssetAlreadyVerified();
    error AssetAlreadySold();
    error FractionalizedAssetWithBuyers();
    error InsufficientTokens();
    error NoTokensOwned();
    error InvalidAmount();
    error InvalidRecipient();
    error InsufficientUSDCBalance();
    error AssetAlreadyPaid();
    error NotBuyer();
    error AssetNotPaid();
    error AssetNotVerified();
    error SellerNotOwner();
    error ContractNotApproved();
    error NoTokensIssued();
    error FractionalAssetDoesNotExist();
    error NotAdmin(address);
    error NotEnoughTokensOwned();

    // --- Events ---
    event AssetCreated(uint256 indexed tokenId, uint256 price, address indexed seller, bool verified);
    event AssetPurchased(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event FractionalAssetCreated(uint256 indexed tokenId, uint256 totalTokens, uint256 pricePerToken, address indexed seller);
    event FractionalAssetPurchased(uint256 indexed tokenId, address indexed buyer, uint256 numTokens, uint256 totalPrice);
    event AssetCanceled(uint256 indexed tokenId, address indexed buyer);
    event AssetPaymentConfirmed(uint256 indexed tokenId, address indexed buyer);
    event SellerRegistered(address indexed sellerAddress);
    event USDCWithdrawn(address indexed recipient, uint256 amount);
    event AssetVerified(uint256 indexed tokenId, address indexed seller);
    event AssetDelisted(uint256 indexed tokenId, address indexed seller);
    event FractionalDividendsDistributed(uint256 indexed tokenId, uint256 totalAmount, address[] buyers, uint256[] amounts);

    constructor(address _realEstateToken, address _usdcToken) ERC721("RealifiAssetToken", "RAT") {
        realEstateToken = RealifiFractionalToken(_realEstateToken);
        usdcToken = IERC20(_usdcToken);
    }

    modifier onlyAdmin {
        if(!isAdmin[msg.sender]) revert NotAdmin(msg.sender);
        _;
    }

    // ============================================
    // GETTER FUNCTIONS FOR UI
    // ============================================

    /// @notice Get if an asset has been paid for
    function isAssetPaidFor(uint256 tokenId) public view returns (bool) {
        return assetPaidFor[tokenId];
    }

    /// @notice Get the buyer of a pending asset purchase
    function getAssetBuyer(uint256 tokenId) public view returns (address) {
        return assetBuyers[tokenId];
    }

    /// @notice Get if an asset purchase was canceled
    function isAssetCanceled(uint256 tokenId) public view returns (bool) {
        return assetCanceled[tokenId];
    }

    /// @notice Get fractional tokens owned by a buyer for a specific asset
    function getBuyerFractions(address buyer, uint256 tokenId) public view returns (uint256) {
        return buyerFractions[buyer][tokenId];
    }

    /// @notice Get list of all fractional buyers for an asset
    function getFractionalAssetBuyersList(uint256 tokenId) public view returns (address[] memory) {
        return fractionalAssetBuyers[tokenId];
    }

    /// @notice Get accumulated USDC from fractional purchases
    function getFractionalPayments(uint256 tokenId) public view returns (uint256) {
        return fractionalPayments[tokenId];
    }

    /// @notice Get seller metrics
    function getSellerMetrics(address sellerAddress) public view returns (uint256 confirmed, uint256 canceled) {
        return (sellerConfirmedPurchases[sellerAddress], sellerCanceledPurchases[sellerAddress]);
    }

    /// @notice Get comprehensive asset display information for UI
    /// @param tokenId The ID of the asset
    /// @return Complete asset information including fractional details
    function getAssetDisplayInfo(uint256 tokenId) public view returns (AssetDisplayInfo memory) {
        RealEstateAsset memory asset = realEstateAssets[tokenId];
        FractionalAsset memory fractional = fractionalAssets[tokenId];
        
        bool isFractionalized = fractional.seller != ZERO_ADDRESS;
        
        return AssetDisplayInfo({
            tokenId: tokenId,
            price: asset.price,
            seller: asset.seller,
            sold: asset.sold,
            verified: asset.verified,
            isPaidFor: assetPaidFor[tokenId],
            isCanceled: assetCanceled[tokenId],
            currentBuyer: assetBuyers[tokenId],
            tokenURI: tokenURI(tokenId),
            isFractionalized: isFractionalized,
            totalFractionalTokens: isFractionalized ? (asset.price / fractional.pricePerToken) : 0,
            remainingFractionalTokens: fractional.totalTokens,
            pricePerFractionalToken: fractional.pricePerToken,
            accumulatedFractionalPayments: fractionalPayments[tokenId]
        });
    }

    /// @notice Get all assets with display info for marketplace UI
    /// @return Array of all listed assets with complete information
    function fetchAllAssetsWithDisplayInfo() public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 currentIndex = 0;

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](itemCount);
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (realEstateAssets[i].seller != ZERO_ADDRESS) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        // Resize array
        assembly {
            mstore(items, currentIndex)
        }

        return items;
    }

    /// @notice Get all verified and unsold assets for marketplace display
    /// @return Array of available assets with complete information
    function fetchAvailableAssets() public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 availableCount = 0;

        // Count available assets
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            RealEstateAsset memory asset = realEstateAssets[i];
            if (asset.seller != ZERO_ADDRESS && !asset.sold && asset.verified) {
                availableCount++;
            }
        }

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](availableCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            RealEstateAsset memory asset = realEstateAssets[i];
            if (asset.seller != ZERO_ADDRESS && !asset.sold && asset.verified) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        return items;
    }

    /// @notice Get all fractionalized assets
    /// @return Array of fractionalized assets with complete information
    function fetchFractionalizedAssets() public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 fractionalCount = 0;

        // Count fractionalized assets
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (fractionalAssets[i].seller != ZERO_ADDRESS) {
                fractionalCount++;
            }
        }

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](fractionalCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (fractionalAssets[i].seller != ZERO_ADDRESS) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        return items;
    }

    /// @notice Get buyer's portfolio of fractional investments
    /// @param buyer The address of the buyer
    /// @return Array of portfolio items showing all fractional investments
    function getBuyerPortfolio(address buyer) public view returns (BuyerPortfolio[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 portfolioCount = 0;

        // Count portfolio items
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (buyerFractions[buyer][i] > 0) {
                portfolioCount++;
            }
        }

        BuyerPortfolio[] memory portfolio = new BuyerPortfolio[](portfolioCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            uint256 tokensOwned = buyerFractions[buyer][i];
            if (tokensOwned > 0) {
                FractionalAsset memory fractional = fractionalAssets[i];
                uint256 totalTokens = realEstateAssets[i].price / fractional.pricePerToken;
                uint256 percentage = (tokensOwned * 100 * PERCENTAGE_SCALE) / totalTokens;
                uint256 value = tokensOwned * fractional.pricePerToken;

                portfolio[currentIndex] = BuyerPortfolio({
                    tokenId: i,
                    fractionalTokensOwned: tokensOwned,
                    ownershipPercentage: percentage,
                    investmentValue: value
                });
                currentIndex++;
            }
        }

        return portfolio;
    }

    /// @notice Get assets owned by a seller
    /// @param seller The address of the seller
    /// @return Array of assets owned by the seller
    function getSellerAssets(address seller) public view returns (AssetDisplayInfo[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 sellerAssetCount = 0;

        // Count seller's assets
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (realEstateAssets[i].seller == seller) {
                sellerAssetCount++;
            }
        }

        AssetDisplayInfo[] memory items = new AssetDisplayInfo[](sellerAssetCount);
        uint256 currentIndex = 0;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (realEstateAssets[i].seller == seller) {
                items[currentIndex] = getAssetDisplayInfo(i);
                currentIndex++;
            }
        }

        return items;
    }

    function registerSeller() public {
        if (sellers[msg.sender]) revert SellerAlreadyRegistered();
        sellers[msg.sender] = true;
        emit SellerRegistered(msg.sender);
    }

    function addAdmin(address _admin) onlyOwner external {
        isAdmin[_admin] = true;
    }

    function removeAdmin(address _admin) onlyOwner external {
        isAdmin[_admin] = false;
    }

    function createAsset(string memory _tokenURI, uint256 _price) public {
        if (!sellers[msg.sender]) revert SellerNotRegistered();
        if (_price == ZERO_AMOUNT) revert InvalidPrice();

        _tokenIds++;
        uint256 newTokenId = _tokenIds;
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        approve(address(this), newTokenId);

        realEstateAssets[newTokenId] = RealEstateAsset(
            newTokenId,
            _price,
            payable(msg.sender),
            false,
            false
        );

        emit AssetCreated(newTokenId, _price, msg.sender, false);
    }

    function verifyAsset(uint256 tokenId) public onlyAdmin {
        if (realEstateAssets[tokenId].seller == ZERO_ADDRESS) revert AssetDoesNotExist();
        if (realEstateAssets[tokenId].verified) revert AssetAlreadyVerified();

        realEstateAssets[tokenId].verified = true;
        emit AssetVerified(tokenId, realEstateAssets[tokenId].seller);
    }

    function delistAsset(uint256 tokenId) public onlyAdmin nonReentrant {
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.seller == ZERO_ADDRESS) revert AssetDoesNotExist();
        if (asset.sold) revert AssetAlreadySold();
        if (fractionalAssets[tokenId].totalTokens > ZERO_AMOUNT || fractionalAssetBuyers[tokenId].length > ZERO_AMOUNT)
            revert FractionalizedAssetWithBuyers();

        if (assetPaidFor[tokenId]) {
            address payable buyer = assetBuyers[tokenId];
            uint256 refundAmount = asset.price;

            assetPaidFor[tokenId] = false;
            assetBuyers[tokenId] = payable(ZERO_ADDRESS);
            assetCanceled[tokenId] = true;
            sellerCanceledPurchases[asset.seller]++;
            usdcToken.safeTransfer(buyer, refundAmount);
        }

        if (getApproved(tokenId) == address(this)) {
            _approve(ZERO_ADDRESS, tokenId);
        }

        address seller = asset.seller;
        delete realEstateAssets[tokenId];

        emit AssetDelisted(tokenId, seller);
    }

    function createFractionalAsset(uint256 tokenId, uint256 totalTokens) public onlyAdmin {
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.seller == ZERO_ADDRESS) revert AssetDoesNotExist();
        if (asset.sold) revert AssetAlreadySold();
        if (!asset.verified) revert AssetNotVerified();
        if (ownerOf(tokenId) != asset.seller) revert SellerNotOwner();
        if (!(getApproved(tokenId) == address(this) || isApprovedForAll(asset.seller, address(this))))
            revert ContractNotApproved();

        uint256 pricePerToken = asset.price / totalTokens;
        fractionalAssets[tokenId] = FractionalAsset(tokenId, totalTokens, pricePerToken, asset.seller);

        realEstateToken.mint(address(this), totalTokens);

        emit FractionalAssetCreated(tokenId, totalTokens, pricePerToken, asset.seller);
    }

    function buyFractionalAsset(uint256 tokenId, uint256 numTokens) public nonReentrant {
        FractionalAsset storage fractionalAsset = fractionalAssets[tokenId];
        if (numTokens == ZERO_AMOUNT) revert InvalidAmount();
        if (fractionalAsset.totalTokens < numTokens) revert InsufficientTokens();

        uint256 totalPrice = numTokens * fractionalAsset.pricePerToken;
        usdcToken.safeTransferFrom(msg.sender, address(this), totalPrice);

        fractionalPayments[tokenId] += totalPrice;
        fractionalAsset.totalTokens -= numTokens;
        buyerFractions[msg.sender][tokenId] += numTokens;

        realEstateToken.safeTransfer(msg.sender, numTokens);

        if (buyerFractions[msg.sender][tokenId] == numTokens) {
            fractionalAssetBuyers[tokenId].push(msg.sender);
        }

        if (
            fractionalAsset.totalTokens == ZERO_AMOUNT &&
            buyerFractions[msg.sender][tokenId] == realEstateAssets[tokenId].price / fractionalAsset.pricePerToken
        ) {
            realEstateAssets[tokenId].sold = true;
            _transfer(realEstateAssets[tokenId].seller, msg.sender, tokenId);
        }

        emit FractionalAssetPurchased(tokenId, msg.sender, numTokens, totalPrice);
    }

    function cancelFractionalAssetPurchase(uint256 tokenId, uint256 numTokens) public nonReentrant {
        if (buyerFractions[msg.sender][tokenId] == ZERO_AMOUNT) revert NoTokensOwned();
        if (buyerFractions[msg.sender][tokenId] < numTokens) revert NotEnoughTokensOwned();

        FractionalAsset storage fractionalAsset = fractionalAssets[tokenId];
        uint256 refundAmount = numTokens * fractionalAsset.pricePerToken;

        fractionalAsset.totalTokens += numTokens;
        buyerFractions[msg.sender][tokenId] -= numTokens;
        fractionalPayments[tokenId] -= refundAmount;

        realEstateToken.safeTransferFrom(msg.sender, address(this), numTokens);

        usdcToken.safeTransfer(msg.sender, refundAmount);

        emit AssetCanceled(tokenId, msg.sender);
    }

    function distributeFractionalDividends(uint256 tokenId, uint256 amount) public onlyAdmin nonReentrant {
        if (fractionalAssets[tokenId].seller == ZERO_ADDRESS) revert FractionalAssetDoesNotExist();
        if (amount == ZERO_AMOUNT) revert InvalidAmount();
        if (usdcToken.balanceOf(address(this)) < amount) revert InsufficientUSDCBalance();

        uint256 totalTokens = realEstateAssets[tokenId].sold
            ? (realEstateAssets[tokenId].price / fractionalAssets[tokenId].pricePerToken)
            : (fractionalAssets[tokenId].totalTokens +
                (fractionalAssetBuyers[tokenId].length > ZERO_AMOUNT
                    ? buyerFractions[fractionalAssetBuyers[tokenId][0]][tokenId]
                    : ZERO_AMOUNT));
        if (totalTokens == ZERO_AMOUNT) revert NoTokensIssued();

        address[] memory buyers = new address[](fractionalAssetBuyers[tokenId].length);
        uint256[] memory amounts = new uint256[](fractionalAssetBuyers[tokenId].length);
        uint256 distributedAmount = ZERO_AMOUNT;

        for (uint256 i = 0; i < fractionalAssetBuyers[tokenId].length; i++) {
            address buyer = fractionalAssetBuyers[tokenId][i];
            uint256 numTokens = buyerFractions[buyer][tokenId];
            if (numTokens > ZERO_AMOUNT) {
                uint256 buyerShare = (amount * numTokens) / totalTokens;
                buyers[i] = buyer;
                amounts[i] = buyerShare;
                distributedAmount += buyerShare;
                usdcToken.safeTransfer(buyer, buyerShare);
            }
        }

        if (distributedAmount < amount) {
            usdcToken.safeTransfer(address(this), amount - distributedAmount);
        }

        emit FractionalDividendsDistributed(tokenId, amount, buyers, amounts);
    }

    function withdrawUSDC(address recipient, uint256 amount) public onlyOwner nonReentrant {
        if (recipient == ZERO_ADDRESS) revert InvalidRecipient();
        if (amount == ZERO_AMOUNT) revert InvalidAmount();
        if (usdcToken.balanceOf(address(this)) < amount) revert InsufficientUSDCBalance();

        usdcToken.safeTransfer(recipient, amount);
        emit USDCWithdrawn(recipient, amount);
    }

    function fetchFractionalAssetBuyers(uint256 tokenId) public view returns (FractionalBuyer[] memory) {
        if (fractionalAssets[tokenId].seller == ZERO_ADDRESS) revert FractionalAssetDoesNotExist();

        uint256 buyerCount = fractionalAssetBuyers[tokenId].length;
        FractionalBuyer[] memory buyers = new FractionalBuyer[](buyerCount);
        uint256 totalTokens = fractionalAssets[tokenId].totalTokens +
            (realEstateAssets[tokenId].sold
                ? (realEstateAssets[tokenId].price / fractionalAssets[tokenId].pricePerToken)
                : (buyerCount > ZERO_AMOUNT ? buyerFractions[fractionalAssetBuyers[tokenId][0]][tokenId] : ZERO_AMOUNT));

        for (uint256 i = 0; i < buyerCount; i++) {
            address buyerAddress = fractionalAssetBuyers[tokenId][i];
            uint256 numTokens = buyerFractions[buyerAddress][tokenId];
            uint256 percentage = totalTokens > ZERO_AMOUNT ? (numTokens * 100 * PERCENTAGE_SCALE) / totalTokens : ZERO_AMOUNT;

            buyers[i] = FractionalBuyer(buyerAddress, numTokens, percentage);
        }

        return buyers;
    }

    function buyAsset(uint256 tokenId) public {
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (asset.sold) revert AssetAlreadySold();
        if (asset.seller == msg.sender) revert NotBuyer();
        if (assetPaidFor[tokenId]) revert AssetAlreadyPaid();
        if (!asset.verified) revert AssetNotVerified();
        if (ownerOf(tokenId) != asset.seller) revert SellerNotOwner();
        if (!(getApproved(tokenId) == address(this) || isApprovedForAll(asset.seller, address(this))))
            revert ContractNotApproved();

        usdcToken.safeTransferFrom(msg.sender, address(this), asset.price);

        assetPaidFor[tokenId] = true;
        assetBuyers[tokenId] = payable(msg.sender);
        emit AssetPurchased(tokenId, msg.sender, asset.price);
    }

    function confirmAssetPayment(uint256 tokenId) public nonReentrant {
        if (assetBuyers[tokenId] != msg.sender) revert NotBuyer();
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (!assetPaidFor[tokenId]) revert AssetNotPaid();
        if (asset.sold) revert AssetAlreadySold();
        if (!asset.verified) revert AssetNotVerified();
        if (ownerOf(tokenId) != asset.seller) revert SellerNotOwner();
        if (!(getApproved(tokenId) == address(this) || isApprovedForAll(asset.seller, address(this))))
            revert ContractNotApproved();

        uint256 listingFee = (asset.price * LISTING_FEE_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        uint256 paymentToSeller = asset.price - listingFee;

        asset.sold = true;
        sellerConfirmedPurchases[asset.seller]++;
        usdcToken.safeTransfer(asset.seller, paymentToSeller);
        usdcToken.safeTransfer(owner(), listingFee);

        _transfer(asset.seller, msg.sender, tokenId);

        emit AssetPaymentConfirmed(tokenId, msg.sender);
    }

    function cancelAssetPurchase(uint256 tokenId) public nonReentrant {
        if (assetBuyers[tokenId] != msg.sender) revert NotBuyer();
        RealEstateAsset storage asset = realEstateAssets[tokenId];
        if (!assetPaidFor[tokenId]) revert AssetNotPaid();
        if (asset.sold) revert AssetAlreadySold();

        uint256 cancellationPenalty = (asset.price * CANCELLATION_PENALTY_PERCENTAGE) / PERCENTAGE_DENOMINATOR;
        uint256 refundToBuyer = asset.price - cancellationPenalty;

        assetPaidFor[tokenId] = false;
        assetCanceled[tokenId] = true;
        sellerCanceledPurchases[asset.seller]++;
        usdcToken.safeTransfer(msg.sender, refundToBuyer);
        usdcToken.safeTransfer(owner(), cancellationPenalty);

        emit AssetCanceled(tokenId, msg.sender);
    }

    function fetchAsset(uint256 tokenId) public view returns (RealEstateAsset memory) {
        return realEstateAssets[tokenId];
    }

    function fetchAllListedAssets() public view returns (RealEstateAsset[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 currentIndex = ZERO_AMOUNT;

        RealEstateAsset[] memory items = new RealEstateAsset[](itemCount);
        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            RealEstateAsset storage currentItem = realEstateAssets[i];
            if (currentItem.seller != ZERO_ADDRESS) {
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        assembly {
            mstore(items, currentIndex)
        }

        return items;
    }

    function fetchUnsoldAssets() public view returns (RealEstateAsset[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 unsoldItemCount = ZERO_AMOUNT;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (!realEstateAssets[i].sold && realEstateAssets[i].seller != ZERO_ADDRESS) {
                unsoldItemCount++;
            }
        }

        RealEstateAsset[] memory items = new RealEstateAsset[](unsoldItemCount);
        uint256 currentIndex = ZERO_AMOUNT;

        for (uint256 i = START_TOKEN_ID; i <= itemCount; i++) {
            if (!realEstateAssets[i].sold && realEstateAssets[i].seller != ZERO_ADDRESS) {
                items[currentIndex] = realEstateAssets[i];
                currentIndex++;
            }
        }

        return items;
    }
}