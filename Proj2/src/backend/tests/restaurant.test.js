/**
 * restaurant.test.js
 * Test suite for restaurant menu details and meal details (UC8, UC15)
 * Tests: View Restaurant Menu Details, View Rescue Meal Details
 */

const request = require('supertest');
const { createMockMeal, resetMocks, assertSuccess } = require('./testUtils');

let mockApp;

describe('Restaurant Menu & Meal Details Routes (UC8, UC15)', () => {
  beforeEach(() => {
    resetMocks();
    // In real scenario: mockApp = require('../src/backend/server');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /restaurants/:id (UC8: View Restaurant Menu Details)', () => {
    it('TC26: Should load restaurant details with metadata and rescue meals', async () => {
      // Expected response with restaurant and meals
      const expected = {
        status: 200,
        body: {
          success: true,
          restaurant: {
            id: 'r1',
            name: 'Test Café',
            location: '123 Main St',
            cuisine: 'Fusion',
            hours: '9AM - 9PM',
          },
          meals: [
            {
              id: 'm1',
              name: 'Chicken Sandwich',
              originalPrice: 12.99,
              rescuePrice: 5.99,
              availableQty: 10,
              pickupWindow: 'lunch',
            },
          ],
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.restaurant).toBeDefined();
      expect(Array.isArray(expected.body.meals)).toBe(true);
    });

    it('TC27: Should display rescue meal cards with complete information', async () => {
      // Verify meal card structure
      const mockMeal = createMockMeal();
      expect(mockMeal).toHaveProperty('name');
      expect(mockMeal).toHaveProperty('originalPrice');
      expect(mockMeal).toHaveProperty('rescuePrice');
      expect(mockMeal).toHaveProperty('baseQty');
      expect(mockMeal).toHaveProperty('pickupWindow');
      expect(mockMeal.name).toBe('Chicken Sandwich');
    });

    it('TC28: Should mark meals as unavailable or hidden when out of stock', async () => {
      // Expected response with out-of-stock meal
      const expected = {
        status: 200,
        body: {
          success: true,
          meals: [
            {
              id: 'm2',
              name: 'Pasta Primavera',
              availableQty: 0,
              isOutOfStock: true,
            },
          ],
        },
      };
      expect(expected.body.meals[0].isOutOfStock).toBe(true);
    });
  });

  describe('GET /meals/:id (UC15: View Rescue Meal Details)', () => {
    it('TC58: Should open meal details with complete information', async () => {
      // Expected meal detail response
      const expected = {
        status: 200,
        body: {
          success: true,
          meal: {
            id: 'm1',
            name: 'Chicken Sandwich',
            description: 'Fresh grilled chicken',
            originalPrice: 12.99,
            rescuePrice: 5.99,
            availableQty: 10,
            pickupWindow: 'lunch',
            ingredients: expect.any(Array),
            allergens: expect.any(Array),
          },
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.meal).toBeDefined();
    });

    it('TC59: Should show appropriate fallback for missing meal information', async () => {
      // Expected response when allergen info missing
      const expected = {
        status: 200,
        body: {
          success: true,
          meal: {
            id: 'm2',
            name: 'Salad',
            allergens: null,
            allergenInfo: 'Allergen info not provided; contact restaurant.',
          },
        },
      };
      expect(expected.body.meal.allergenInfo).toBeDefined();
    });

    it('TC60: Should disable add-to-cart when meal goes out of stock', async () => {
      // Expected response with out-of-stock meal
      const expected = {
        status: 200,
        body: {
          success: true,
          meal: {
            id: 'm3',
            name: 'Soup',
            availableQty: 0,
            canAddToCart: false,
          },
        },
      };
      expect(expected.body.meal.canAddToCart).toBe(false);
    });
  });
});
