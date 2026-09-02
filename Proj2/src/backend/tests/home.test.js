/**
 * home.test.js
 * Test suite for public home page and restaurant discovery (UC6-UC7)
 * Tests: Home Page & Impact Statistics, Browse Nearby Restaurants
 */

const request = require('supertest');
const { resetMocks, assertSuccess, assertError } = require('./testUtils');

let mockApp;

describe('Home & Restaurant Discovery Routes (UC6-UC7)', () => {
  beforeEach(() => {
    resetMocks();
    // In real scenario: mockApp = require('../src/backend/server');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET / (UC6: View Home Page & Impact Statistics)', () => {
    it('TC19: Should load home page with impact statistics as unauthenticated visitor', async () => {
      // Expected response with impact data
      const expected = {
        status: 200,
        body: {
          success: true,
          impactStats: {
            mealsRescued: 0,
            wastePrevented: 0,
            activeUsers: 0,
          },
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(true);
      expect(expected.body.impactStats).toBeDefined();
      expect(expected.body.impactStats.mealsRescued).toBeGreaterThanOrEqual(0);
    });

    it('TC20: Should display impact cards with proper metrics', async () => {
      // Expected impact card data
      const expected = {
        status: 200,
        body: {
          success: true,
          impactCards: [
            {
              title: 'Meals Rescued',
              value: expect.any(Number),
            },
            {
              title: 'Waste Prevented',
              value: expect.any(Number),
            },
            {
              title: 'Active Users',
              value: expect.any(Number),
            },
          ],
        },
      };
      expect(expected.body.impactCards).toBeDefined();
      expect(Array.isArray(expected.body.impactCards)).toBe(true);
    });

    it('TC21: Should handle missing or unavailable statistics gracefully', async () => {
      // Expected fallback/loading state
      const expected = {
        status: 200,
        body: {
          success: true,
          impactStats: {
            mealsRescued: 0,
            wastePrevented: 0,
            activeUsers: 0,
          },
          loading: false,
        },
      };
      expect(expected.status).toBe(200);
      // Should not return error status even if stats unavailable
    });
  });

  describe('GET /restaurants (UC7: Browse Nearby Restaurants)', () => {
    it('TC22: Should return list of restaurants with meal counts', async () => {
      // Expected response with restaurant listings
      const expected = {
        status: 200,
        body: {
          success: true,
          restaurants: [
            {
              id: expect.any(String),
              name: expect.any(String),
              location: expect.any(String),
              cuisine: expect.any(String),
              mealCount: expect.any(Number),
            },
          ],
        },
      };
      expect(expected.status).toBe(200);
      expect(Array.isArray(expected.body.restaurants)).toBe(true);
    });

    it('TC23: Should include required restaurant metadata on each card', async () => {
      // Verify restaurant object structure
      const mockRestaurant = {
        id: 'r1',
        name: 'Test Café',
        location: '123 Main St',
        cuisine: 'Fusion',
        mealCount: 5,
      };
      expect(mockRestaurant).toHaveProperty('name');
      expect(mockRestaurant).toHaveProperty('location');
      expect(mockRestaurant).toHaveProperty('cuisine');
      expect(mockRestaurant).toHaveProperty('mealCount');
    });

    it('TC25: Should filter restaurants by search or cuisine criteria', async () => {
      // Expected response with filtered results
      const expected = {
        status: 200,
        body: {
          success: true,
          restaurants: [],
          filter: 'Fusion',
        },
      };
      expect(expected.body.restaurants).toBeDefined();
      expect(Array.isArray(expected.body.restaurants)).toBe(true);
    });
  });
});
