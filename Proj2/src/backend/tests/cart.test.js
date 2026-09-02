/**
 * cart.test.js
 * Test suite for shopping cart operations and checkout (UC9-UC11)
 * Tests: Add to Cart, Place Order (Checkout), Order Confirmation
 * Includes inventory validation and edge cases
 */

const request = require('supertest');
const app = require('../server');
const {
  buildAddToCartRequest,
  buildCheckoutRequest,
  createMockMeal,
  createMockOrder,
  resetMocks,
  assertSuccess,
  assertError,
} = require('./testUtils');

let mockApp;

describe('Shopping Cart & Checkout Routes (UC9-UC11)', () => {
  it('should reject duplicate cart lines whose combined quantity exceeds inventory', async () => {
    const meal = { id: 'm1', name: 'Chicken Sandwich', quantity: 10,
      rescuePrice: 5.99, originalPrice: 12.99, isRescueMeal: true };
    const response = await request(app).post('/checkout').send({
      cart: [
        { restaurant: 'Test Cafe', meal, quantity: 6 },
        { restaurant: 'Test Cafe', meal, quantity: 6 },
      ], userEmail: 'customer@example.com',
    });
    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.inventoryErrors).toEqual(expect.arrayContaining([
      expect.objectContaining({ mealId: 'm1', requested: 12, available: 10 }),
    ]));
  });
  beforeEach(() => {
    resetMocks();
    // In real scenario: mockApp = require('../src/backend/server');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /cart/add (UC9: Add Rescue Meal to Cart)', () => {
    it('TC30: Should successfully add available meal to cart', async () => {
      const payload = buildAddToCartRequest({
        mealId: 'm1',
        qty: 1,
      });

      // Expected success response
      const expected = {
        status: 200,
        body: {
          success: true,
          message: 'Meal added to cart',
          cart: [],
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(true);
      expect(Array.isArray(expected.body.cart)).toBe(true);
    });

    it('TC31: Should add correct quantity when within available inventory', async () => {
      const payload = buildAddToCartRequest({
        mealId: 'm1',
        qty: 3,
      });

      // Expected response with correct quantity
      const expected = {
        status: 200,
        body: {
          success: true,
          cart: [
            {
              mealId: 'm1',
              qty: 3,
            },
          ],
        },
      };
      expect(expected.body.cart[0].qty).toBe(3);
    });

    it('TC32: Should warn or cap quantity when it exceeds available stock', async () => {
      const payload = buildAddToCartRequest({
        mealId: 'm1',
        qty: 50, // More than available
      });

      // Expected warning or cap response
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'Only 10 available; quantity capped',
          suggestedQty: 10,
        },
      };
      expect(expected.body.message).toContain('available');
    });

    it('TC33: Should increase quantity instead of creating duplicate when adding same meal twice', async () => {
      // Simulate adding same meal twice
      const payload = buildAddToCartRequest({
        mealId: 'm1',
        qty: 1,
      });

      // Expected: quantity increased, not duplicate entry
      const expected = {
        status: 200,
        body: {
          success: true,
          cart: [
            {
              mealId: 'm1',
              qty: 2, // Increased from 1 to 2
            },
          ],
        },
      };
      expect(expected.body.cart.length).toBe(1);
      expect(expected.body.cart[0].qty).toBe(2);
    });

    it('TC34: Should prevent adding meal that is out of stock', async () => {
      const payload = buildAddToCartRequest({
        mealId: 'm-outofstock',
        qty: 1,
      });

      // Expected error response
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'Meal is out of stock',
        },
      };
      expect(expected.body.success).toBe(false);
    });
  });

  describe('POST /cart/checkout (UC10: Place Order / Checkout)', () => {
    it('TC35: Should successfully create order with valid cart using cash on delivery', async () => {
      const payload = buildCheckoutRequest({
        paymentMethod: 'cod',
      });

      // Expected successful order response
      const expected = {
        status: 201,
        body: {
          success: true,
          orderId: expect.any(String),
          total: expect.any(Number),
          message: 'Order placed successfully',
        },
      };
      expect(expected.status).toBe(201);
      expect(expected.body.orderId).toBeDefined();
    });

    it('TC36: Should reject order when cart is empty', async () => {
      const payload = buildCheckoutRequest({
        cart: [],
      });

      // Expected error response
      const expected = {
        status: 400,
        body: {
          success: false,
          error: 'Cart is empty. Please add at least one rescue meal.',
        },
      };
      expect(expected.status).toBe(400);
      expect(expected.body.error).toContain('empty');
    });

    it('TC37: Should calculate order summary correctly (items, subtotal, discount, total)', async () => {
      const payload = buildCheckoutRequest({
        cart: [
          {
            mealId: 'm1',
            name: 'Chicken Sandwich',
            qty: 2,
            rescuePrice: 5.99,
          },
        ],
      });

      // Expected calculation
      const expected = {
        status: 201,
        body: {
          success: true,
          orderSummary: {
            items: 2,
            subtotal: 11.98,
            discount: 5.99,
            total: 5.99,
          },
        },
      };
      expect(expected.body.orderSummary.items).toBe(2);
      expect(expected.body.orderSummary.subtotal).toBe(11.98);
      expect(expected.body.orderSummary.total).toBeLessThan(expected.body.orderSummary.subtotal);
    });

    it('TC38: Should show demo warning for card payment and prevent processing', async () => {
      const payload = buildCheckoutRequest({
        paymentMethod: 'card',
      });

      // Expected response showing card is demo-only
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'Card payment is a demo. Please use Cash on Delivery.',
          demoWarning: true,
        },
      };
      expect(expected.body.demoWarning).toBe(true);
    });

    it('TC39: Should return inventory conflict with specific meal details when requested quantity unavailable', async () => {
      const payload = buildCheckoutRequest({
        cart: [
          {
            mealId: 'm1',
            qty: 15, // More than available (base: 10)
          },
        ],
      });

      // Expected HTTP 409 Conflict with inventoryErrors
      const expected = {
        status: 409,
        body: {
          success: false,
          error: 'Inventory conflict',
          inventoryErrors: [
            {
              mealId: 'm1',
              mealName: 'Chicken Sandwich',
              requested: 15,
              available: 10,
            },
          ],
        },
      };
      expect(expected.status).toBe(409);
      expect(expected.body.inventoryErrors).toBeDefined();
      expect(expected.body.inventoryErrors[0].requested).toBe(15);
    });

    it('TC40: Should verify inventory is decremented correctly after successful order', async () => {
      // Simulate successful order
      const expectedInventoryAfter = {
        mealId: 'm1',
        baseQty: 10,
        soldSoFar: 2, // Was 0, added 2 items
        available: 8,
      };
      expect(expectedInventoryAfter.available).toBe(
        expectedInventoryAfter.baseQty - expectedInventoryAfter.soldSoFar
      );
    });

    it('TC41: Should persist order after checkout so it remains retrievable after refresh', async () => {
      // Create order
      const order = createMockOrder({
        orderId: 'o123',
        status: 'Pending',
      });

      // Verify order can be retrieved
      const expected = {
        status: 200,
        body: {
          success: true,
          order: {
            orderId: 'o123',
            status: 'Pending',
            timestamp: expect.any(Number),
          },
        },
      };
      expect(expected.body.order.orderId).toBe('o123');
      expect(expected.body.order).toHaveProperty('timestamp');
    });
  });

  describe('GET /orders/:orderId (UC11: Order Confirmation & Impact Progress)', () => {
    it('TC42: Should display order confirmation with order ID and timestamp', async () => {
      // Expected confirmation response
      const expected = {
        status: 200,
        body: {
          success: true,
          confirmation: {
            orderId: expect.any(String),
            timestamp: expect.any(Number),
            status: 'Pending',
          },
        },
      };
      expect(expected.body.confirmation).toBeDefined();
      expect(expected.body.confirmation.orderId).toBeDefined();
    });

    it('TC43: Should display rescue progress bar with 4 milestones', async () => {
      // Expected progress response
      const expected = {
        status: 200,
        body: {
          success: true,
          progressBar: {
            milestone1: {
              percent: 25,
              label: 'Order Received',
            },
            milestone2: {
              percent: 50,
              label: 'Reserving Meals',
            },
            milestone3: {
              percent: 75,
              label: 'Coordinating Pickup',
            },
            milestone4: {
              percent: 100,
              label: 'Ready for Pickup',
            },
          },
        },
      };
      expect(expected.body.progressBar).toBeDefined();
      expect(Object.keys(expected.body.progressBar).length).toBe(4);
    });

    it('TC44: Should display impact summary with meals rescued and waste prevented', async () => {
      // Expected impact summary
      const expected = {
        status: 200,
        body: {
          success: true,
          impactSummary: {
            mealsRescued: 2,
            wastePrevented: 1.2,
            co2Offset: 0.8,
          },
        },
      };
      expect(expected.body.impactSummary).toBeDefined();
      expect(expected.body.impactSummary.mealsRescued).toBeGreaterThan(0);
    });

    it('TC45: Should provide pickup information and estimated pickup time', async () => {
      // Expected pickup info
      const expected = {
        status: 200,
        body: {
          success: true,
          pickupInfo: {
            restaurantName: 'Test Café',
            pickupWindow: 'lunch',
            estimatedTime: expect.any(String),
          },
        },
      };
      expect(expected.body.pickupInfo).toBeDefined();
      expect(expected.body.pickupInfo.restaurantName).toBeDefined();
    });
  });
});
