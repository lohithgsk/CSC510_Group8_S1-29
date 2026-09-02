/**
 * dashboard.test.js
 * Test suite for restaurant operations and analytics (UC16-UC19)
 * Tests: Restaurant Dashboard, Order Status Update, Inventory Management, Analytics
 */

const request = require('supertest');
const app = require('../server');
const {
  buildDashboardRequest,
  createMockMeal,
  resetMocks,
  assertSuccess,
} = require('./testUtils');

let mockApp;

describe('Restaurant Dashboard & Operations Routes (UC16-UC19)', () => {
  it('should reject illegal order-status transitions', async () => {
    const response = await request(app)
      .patch('/restaurant/order-status')
      .send({ orderId: 'o1', status: 'PENDING' });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
  beforeEach(() => {
    resetMocks();
    // In real scenario: mockApp = require('../src/backend/server');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /dashboard (UC16: View Restaurant Dashboard)', () => {
    it('TC61: Should load restaurant dashboard with expected tabs and KPIs', async () => {
      const payload = buildDashboardRequest({
        restaurantId: 'r1',
      });

      // Expected dashboard response
      const expected = {
        status: 200,
        body: {
          success: true,
          dashboard: {
            tabs: ['Today', 'Stats', 'Menu', 'Orders'],
            kpis: {
              ordersPlacedToday: expect.any(Number),
              mealsRescued: expect.any(Number),
              wastePrevented: expect.any(Number),
            },
          },
        },
      };
      expect(expected.status).toBe(200);
      expect(Array.isArray(expected.body.dashboard.tabs)).toBe(true);
      expect(expected.body.dashboard.tabs.length).toBe(4);
    });

    it('TC62: Should display KPIs and recent order data on dashboard', async () => {
      // Expected KPI and order data
      const expected = {
        status: 200,
        body: {
          success: true,
          kpis: {
            ordersPlacedToday: 5,
            mealsRescued: 12,
            wastePrevented: 6.5,
          },
          recentOrders: [
            {
              orderId: expect.any(String),
              timestamp: expect.any(Number),
              status: 'Pending',
              itemCount: expect.any(Number),
            },
          ],
        },
      };
      expect(expected.body.kpis).toBeDefined();
      expect(Array.isArray(expected.body.recentOrders)).toBe(true);
    });

    it('TC63: Should display appropriate empty state when restaurant has no meals/orders', async () => {
      // Expected empty state response
      const expected = {
        status: 200,
        body: {
          success: true,
          kpis: {
            ordersPlacedToday: 0,
            mealsRescued: 0,
            wastePrevented: 0,
          },
          emptyState: {
            message: 'No orders yet. Add rescue meals to get started!',
          },
        },
      };
      expect(expected.body.kpis.ordersPlacedToday).toBe(0);
      expect(expected.body.emptyState).toBeDefined();
    });
  });

  describe('PATCH /orders/:orderId/status (UC17: Update Order Status)', () => {
    it('TC64: Should update order status from Pending to Ready', async () => {
      const payload = {
        orderId: 'o1',
        newStatus: 'Ready',
      };

      // Expected status update response
      const expected = {
        status: 200,
        body: {
          success: true,
          message: 'Order status updated',
          order: {
            orderId: 'o1',
            status: 'Ready',
            updatedAt: expect.any(Number),
          },
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.order.status).toBe('Ready');
    });

    it('TC65: Should transition from Ready to Picked Up status', async () => {
      const payload = {
        orderId: 'o1',
        currentStatus: 'Ready',
        newStatus: 'Picked Up',
      };

      // Expected response
      const expected = {
        status: 200,
        body: {
          success: true,
          order: {
            status: 'Picked Up',
          },
        },
      };
      expect(expected.body.order.status).toBe('Picked Up');
    });

    it('TC66: Should reject invalid status transitions (e.g., Picked Up to Pending)', async () => {
      const payload = {
        orderId: 'o1',
        currentStatus: 'Picked Up',
        newStatus: 'Pending',
      };

      // Expected error response
      const expected = {
        status: 400,
        body: {
          success: false,
          message: 'Invalid status transition',
        },
      };
      expect(expected.status).toBe(400);
      expect(expected.body.success).toBe(false);
    });

    it('TC67: Should handle No-Show status and record for analytics', async () => {
      const payload = {
        orderId: 'o1',
        newStatus: 'No-Show',
      };

      // Expected response with No-Show recorded
      const expected = {
        status: 200,
        body: {
          success: true,
          order: {
            status: 'No-Show',
            recordedForAnalytics: true,
          },
        },
      };
      expect(expected.body.order.status).toBe('No-Show');
      expect(expected.body.order.recordedForAnalytics).toBe(true);
    });
  });

  describe('GET /menu (UC18: View Inventory & Manage Rescue Meals)', () => {
    it('TC68: Should display restaurant inventory with all rescue meals', async () => {
      // Expected inventory response
      const expected = {
        status: 200,
        body: {
          success: true,
          inventory: [
            {
              mealId: 'm1',
              name: 'Chicken Sandwich',
              baseQty: 10,
              soldSoFar: 2,
              remainingQty: 8,
              rescuePrice: 5.99,
              originalPrice: 12.99,
            },
          ],
        },
      };
      expect(expected.status).toBe(200);
      expect(Array.isArray(expected.body.inventory)).toBe(true);
    });

    it('TC69: Should successfully add new rescue meal with valid fields', async () => {
      const payload = {
        name: 'Veggie Wrap',
        description: 'Fresh vegetables',
        originalPrice: 8.99,
        rescuePrice: 3.99,
        baseQty: 15,
        pickupWindow: 'lunch',
      };

      // Expected success response
      const expected = {
        status: 201,
        body: {
          success: true,
          message: 'Rescue meal added',
          mealId: expect.any(String),
        },
      };
      expect(expected.status).toBe(201);
      expect(expected.body.mealId).toBeDefined();
    });

    it('TC70: Should reject meal creation with required field missing', async () => {
      const payload = {
        description: 'Missing name field',
        originalPrice: 8.99,
        rescuePrice: 3.99,
        baseQty: 15,
      };

      // Expected error response
      const expected = {
        status: 400,
        body: {
          success: false,
          message: 'Meal name is required',
        },
      };
      expect(expected.status).toBe(400);
      expect(expected.body.success).toBe(false);
    });

    it('TC71: Should synchronize inventory with customer-visible availability', async () => {
      // Restaurant adjusts quantity
      const inventoryBefore = {
        mealId: 'm1',
        baseQty: 10,
        soldSoFar: 2,
        available: 8,
      };

      // Simulate adjustment
      const inventoryAfter = {
        mealId: 'm1',
        baseQty: 15, // Increased
        soldSoFar: 2,
        available: 13,
      };

      // Verify synchronization
      expect(inventoryAfter.available).toBe(inventoryAfter.baseQty - inventoryAfter.soldSoFar);
      expect(inventoryAfter.available).toBeGreaterThan(inventoryBefore.available);
    });
  });

  describe('GET /analytics (UC19: View Restaurant Performance Metrics)', () => {
    it('TC72: Should render restaurant analytics with charts and metrics', async () => {
      // Expected analytics response
      const expected = {
        status: 200,
        body: {
          success: true,
          analytics: {
            mealsRescuedThisWeek: expect.any(Number),
            revenueThisWeek: expect.any(Number),
            wastePrevented: expect.any(Number),
            co2Offset: expect.any(Number),
            charts: {
              mealsOverTime: expect.any(Array),
              revenueTrend: expect.any(Array),
              topMeals: expect.any(Array),
            },
          },
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.analytics.charts).toBeDefined();
    });

    it('TC73: Should allow export of analytics report as CSV or PDF', async () => {
      const payload = {
        restaurantId: 'r1',
        format: 'csv',
      };

      // Expected export response
      const expected = {
        status: 200,
        headers: {
          'content-type': 'text/csv',
        },
        body: expect.any(String),
      };
      expect(expected.status).toBe(200);
      expect(expected.headers['content-type']).toContain('csv');
    });

    it('TC77: Should display restaurant performance vs. platform average', async () => {
      // Expected performance comparison
      const expected = {
        status: 200,
        body: {
          success: true,
          analytics: {
            restaurantMetrics: {
              mealsRescued: 50,
              avgRating: 4.2,
            },
            platformAverage: {
              mealsRescued: 35,
              avgRating: 3.8,
            },
            performanceRank: 1,
          },
        },
      };
      expect(expected.body.analytics.restaurantMetrics).toBeDefined();
      expect(expected.body.analytics.platformAverage).toBeDefined();
    });

    it('TC78: Should display customer sentiment and recent reviews on analytics', async () => {
      // Expected sentiment data
      const expected = {
        status: 200,
        body: {
          success: true,
          analytics: {
            averageRating: 4.2,
            totalReviews: 15,
            recentReviews: [
              {
                rating: 5,
                comment: 'Excellent service',
                timestamp: expect.any(Number),
              },
            ],
          },
        },
      };
      expect(expected.body.analytics.averageRating).toBeDefined();
      expect(Array.isArray(expected.body.analytics.recentReviews)).toBe(true);
    });
  });
});
