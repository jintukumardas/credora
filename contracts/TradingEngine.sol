// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title TradingEngine
 * @notice Automated market maker and orderbook for domain trading
 */
contract TradingEngine is ReentrancyGuard, Ownable {
    enum OrderStatus { PENDING, MATCHED, CANCELLED, EXPIRED }

    struct TradingPair {
        address baseAsset;
        address quoteAsset;
        uint256 lastPrice;
        uint256 volume24h;
        uint256 liquidity;
        bool active;
    }

    struct LimitOrder {
        address trader;
        address pairId;
        bool isBuy;
        uint256 amount;
        uint256 price;
        uint256 filled;
        OrderStatus status;
        uint256 timestamp;
        uint256 expiry;
    }

    struct MarketMetrics {
        uint256 high24h;
        uint256 low24h;
        uint256 volumeBase;
        uint256 volumeQuote;
        uint256 txCount;
    }

    uint256 private _orderIdCounter;
    uint256 private _pairIdCounter;

    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public makerFeeRate = 10; // 0.1%
    uint256 public takerFeeRate = 25; // 0.25%

    mapping(uint256 => TradingPair) public tradingPairs;
    mapping(uint256 => LimitOrder) public orders;
    mapping(address => mapping(address => uint256)) public pairLookup;
    mapping(uint256 => MarketMetrics) public dailyMetrics;
    mapping(address => uint256[]) public userActiveOrders;

    // Liquidity pools for AMM
    mapping(uint256 => uint256) public reserveBase;
    mapping(uint256 => uint256) public reserveQuote;
    mapping(uint256 => uint256) public kConstant;

    event PairCreated(uint256 indexed pairId, address baseAsset, address quoteAsset);
    event OrderPlaced(uint256 indexed orderId, address indexed trader, uint256 pairId, bool isBuy, uint256 amount, uint256 price);
    event OrderMatched(uint256 indexed buyOrderId, uint256 indexed sellOrderId, uint256 executedAmount, uint256 executedPrice);
    event OrderCancelled(uint256 indexed orderId);
    event LiquidityAdded(uint256 indexed pairId, uint256 baseAmount, uint256 quoteAmount, address provider);
    event LiquidityRemoved(uint256 indexed pairId, uint256 baseAmount, uint256 quoteAmount, address provider);
    event Swap(uint256 indexed pairId, address indexed trader, uint256 amountIn, uint256 amountOut, bool buyBase);

    constructor() Ownable(msg.sender) {}

    function createTradingPair(
        address _baseAsset,
        address _quoteAsset
    ) external onlyOwner returns (uint256) {
        require(_baseAsset != address(0) && _quoteAsset != address(0), "Invalid assets");
        require(pairLookup[_baseAsset][_quoteAsset] == 0, "Pair exists");

        uint256 pairId = ++_pairIdCounter;

        tradingPairs[pairId] = TradingPair({
            baseAsset: _baseAsset,
            quoteAsset: _quoteAsset,
            lastPrice: 0,
            volume24h: 0,
            liquidity: 0,
            active: true
        });

        pairLookup[_baseAsset][_quoteAsset] = pairId;
        pairLookup[_quoteAsset][_baseAsset] = pairId;

        emit PairCreated(pairId, _baseAsset, _quoteAsset);
        return pairId;
    }

    function placeLimitOrder(
        uint256 _pairId,
        bool _isBuy,
        uint256 _amount,
        uint256 _price,
        uint256 _expiry
    ) external nonReentrant returns (uint256) {
        TradingPair memory pair = tradingPairs[_pairId];
        require(pair.active, "Pair inactive");
        require(_amount > 0 && _price > 0, "Invalid amounts");
        require(_expiry > block.timestamp, "Invalid expiry");

        uint256 orderId = ++_orderIdCounter;

        orders[orderId] = LimitOrder({
            trader: msg.sender,
            pairId: address(_pairId),
            isBuy: _isBuy,
            amount: _amount,
            price: _price,
            filled: 0,
            status: OrderStatus.PENDING,
            timestamp: block.timestamp,
            expiry: _expiry
        });

        userActiveOrders[msg.sender].push(orderId);

        // Transfer tokens for sell orders
        if (!_isBuy) {
            IERC20(pair.baseAsset).transferFrom(msg.sender, address(this), _amount);
        } else {
            uint256 requiredQuote = (_amount * _price) / 1e18;
            IERC20(pair.quoteAsset).transferFrom(msg.sender, address(this), requiredQuote);
        }

        emit OrderPlaced(orderId, msg.sender, _pairId, _isBuy, _amount, _price);

        // Try to match order
        _matchOrders(_pairId, orderId);

        return orderId;
    }

    function swap(
        uint256 _pairId,
        uint256 _amountIn,
        bool _buyBase,
        uint256 _minAmountOut
    ) external nonReentrant returns (uint256) {
        TradingPair storage pair = tradingPairs[_pairId];
        require(pair.active, "Pair inactive");
        require(_amountIn > 0, "Invalid amount");

        uint256 amountOut;

        if (_buyBase) {
            // Buying base with quote
            amountOut = _getAmountOut(_amountIn, reserveQuote[_pairId], reserveBase[_pairId]);
            require(amountOut >= _minAmountOut, "Slippage exceeded");

            IERC20(pair.quoteAsset).transferFrom(msg.sender, address(this), _amountIn);
            IERC20(pair.baseAsset).transfer(msg.sender, amountOut);

            reserveQuote[_pairId] += _amountIn;
            reserveBase[_pairId] -= amountOut;
        } else {
            // Selling base for quote
            amountOut = _getAmountOut(_amountIn, reserveBase[_pairId], reserveQuote[_pairId]);
            require(amountOut >= _minAmountOut, "Slippage exceeded");

            IERC20(pair.baseAsset).transferFrom(msg.sender, address(this), _amountIn);
            IERC20(pair.quoteAsset).transfer(msg.sender, amountOut);

            reserveBase[_pairId] += _amountIn;
            reserveQuote[_pairId] -= amountOut;
        }

        // Update metrics
        pair.lastPrice = (reserveQuote[_pairId] * 1e18) / reserveBase[_pairId];
        pair.volume24h += _amountIn;

        emit Swap(_pairId, msg.sender, _amountIn, amountOut, _buyBase);

        return amountOut;
    }

    function addLiquidity(
        uint256 _pairId,
        uint256 _baseAmount,
        uint256 _quoteAmount
    ) external nonReentrant {
        TradingPair storage pair = tradingPairs[_pairId];
        require(pair.active, "Pair inactive");

        IERC20(pair.baseAsset).transferFrom(msg.sender, address(this), _baseAmount);
        IERC20(pair.quoteAsset).transferFrom(msg.sender, address(this), _quoteAmount);

        reserveBase[_pairId] += _baseAmount;
        reserveQuote[_pairId] += _quoteAmount;
        kConstant[_pairId] = reserveBase[_pairId] * reserveQuote[_pairId];

        pair.liquidity += _baseAmount + _quoteAmount;

        emit LiquidityAdded(_pairId, _baseAmount, _quoteAmount, msg.sender);
    }

    function removeLiquidity(
        uint256 _pairId,
        uint256 _shares
    ) external nonReentrant {
        // Implementation for removing liquidity proportionally
        // This would include LP token management in a full implementation
    }

    function cancelOrder(uint256 _orderId) external nonReentrant {
        LimitOrder storage order = orders[_orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.status == OrderStatus.PENDING, "Order not pending");

        order.status = OrderStatus.CANCELLED;

        // Refund tokens
        TradingPair memory pair = tradingPairs[uint256(uint160(order.pairId))];
        if (order.isBuy) {
            uint256 refundAmount = ((order.amount - order.filled) * order.price) / 1e18;
            IERC20(pair.quoteAsset).transfer(msg.sender, refundAmount);
        } else {
            IERC20(pair.baseAsset).transfer(msg.sender, order.amount - order.filled);
        }

        emit OrderCancelled(_orderId);
    }

    function _matchOrders(uint256 _pairId, uint256 _newOrderId) private {
        LimitOrder storage newOrder = orders[_newOrderId];

        // Simple matching logic - in production would use orderbook tree
        for (uint256 i = 1; i <= _orderIdCounter; i++) {
            if (i == _newOrderId) continue;

            LimitOrder storage existingOrder = orders[i];
            if (uint256(uint160(existingOrder.pairId)) != _pairId) continue;
            if (existingOrder.status != OrderStatus.PENDING) continue;
            if (existingOrder.isBuy == newOrder.isBuy) continue;

            // Check price match
            bool priceMatch = newOrder.isBuy ?
                newOrder.price >= existingOrder.price :
                existingOrder.price >= newOrder.price;

            if (priceMatch) {
                uint256 matchAmount = _min(
                    newOrder.amount - newOrder.filled,
                    existingOrder.amount - existingOrder.filled
                );

                uint256 executionPrice = existingOrder.price; // Price-time priority

                newOrder.filled += matchAmount;
                existingOrder.filled += matchAmount;

                if (newOrder.filled == newOrder.amount) {
                    newOrder.status = OrderStatus.MATCHED;
                }
                if (existingOrder.filled == existingOrder.amount) {
                    existingOrder.status = OrderStatus.MATCHED;
                }

                _executeTrade(_pairId, matchAmount, executionPrice,
                    newOrder.isBuy ? newOrder.trader : existingOrder.trader,
                    newOrder.isBuy ? existingOrder.trader : newOrder.trader);

                emit OrderMatched(
                    newOrder.isBuy ? _newOrderId : i,
                    newOrder.isBuy ? i : _newOrderId,
                    matchAmount,
                    executionPrice
                );

                if (newOrder.status == OrderStatus.MATCHED) break;
            }
        }
    }

    function _executeTrade(
        uint256 _pairId,
        uint256 _amount,
        uint256 _price,
        address _buyer,
        address _seller
    ) private {
        TradingPair memory pair = tradingPairs[_pairId];

        uint256 quoteAmount = (_amount * _price) / 1e18;

        // Apply fees
        uint256 baseFee = (_amount * takerFeeRate) / FEE_DENOMINATOR;
        uint256 quoteFee = (quoteAmount * makerFeeRate) / FEE_DENOMINATOR;

        // Transfer tokens
        IERC20(pair.baseAsset).transfer(_buyer, _amount - baseFee);
        IERC20(pair.quoteAsset).transfer(_seller, quoteAmount - quoteFee);

        // Update metrics
        tradingPairs[_pairId].lastPrice = _price;
        tradingPairs[_pairId].volume24h += _amount;
    }

    function _getAmountOut(
        uint256 _amountIn,
        uint256 _reserveIn,
        uint256 _reserveOut
    ) private pure returns (uint256) {
        require(_amountIn > 0, "Invalid input");
        require(_reserveIn > 0 && _reserveOut > 0, "No liquidity");

        uint256 amountInWithFee = _amountIn * 997; // 0.3% fee
        uint256 numerator = amountInWithFee * _reserveOut;
        uint256 denominator = (_reserveIn * 1000) + amountInWithFee;

        return numerator / denominator;
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function getActiveOrders(address _trader) external view returns (uint256[] memory) {
        return userActiveOrders[_trader];
    }

    function getPairMetrics(uint256 _pairId) external view returns (
        uint256 price,
        uint256 volume,
        uint256 liquidity
    ) {
        TradingPair memory pair = tradingPairs[_pairId];
        return (pair.lastPrice, pair.volume24h, pair.liquidity);
    }
}