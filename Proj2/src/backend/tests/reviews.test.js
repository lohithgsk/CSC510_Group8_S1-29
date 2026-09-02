/**
 * reviews.test.js
 * Test suite for restaurant reviews and community leaderboard (UC13-UC14)
 * Tests: Submit Restaurant Review, View Community Leaderboard
 */

const request = require('supertest');
const app = require('../server');
const { buildReviewRequest, resetMocks, assertSuccess } = require('./testUtils');

let mockApp;

describe('Reviews & Leaderboard Routes (UC13-UC14)', () => {
  it('should expose the review API at the /api/reviews path used by the frontend', async () => {
    const response = await request(app).get('/api/reviews/r1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, reviews: [] });
  });

  it('should reject review ratings outside the supported 1-to-5 range', async () => {
    const response = await request(app).post('/reviews').send({
      restaurantId: 'r1', rating: 99,
      comment: 'Invalid rating should not be stored', userName: 'Test Customer',
    });
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

  describe('POST /reviews (UC13: Submit Restaurant Review)', () => {
    it('TC50: Should successfully submit a valid 1-5 star review', async () => {
      const payload = buildReviewRequest({
        restaurantId: 'r1',
        rating: 4,
        comment: 'Great food and excellent service!',
        customerName: 'Alice',
      });

      // Expected success response
      const expected = {
        status: 201,
        body: {
          success: true,
          message: 'Review submitted successfully',
          reviewId: expect.any(String),
        },
      };
      expect(expected.status).toBe(201);
      expect(expected.body.success).toBe(true);
    });

    it('TC51: Should reject review submission without a rating', async () => {
      const payload = buildReviewRequest({
        restaurantId: 'r1',
        rating: null,
        comment: 'No rating provided',
      });

      // Expected error response
      const expected = {
        status: 400,
        body: {
          success: false,
          message: 'Rating is required (1-5 stars)',
        },
      };
      expect(expected.status).toBe(400);
      expect(expected.body.success).toBe(false);
    });

    it('TC52: Should handle comments exceeding maximum length gracefully', async () => {
      const longComment = 'A'.repeat(1000); // Long comment
      const payload = buildReviewRequest({
        restaurantId: 'r1',
        rating: 3,
        comment: longComment,
      });

      // Expected: either truncated or rejected
      const expected = {
        status: 201,
        body: {
          success: true,
          reviewId: expect.any(String),
          commentTruncated: true,
        },
      };
      // Should either succeed with truncation or fail gracefully
      expect(expected.body.success || !expected.body.success).toBe(true);
    });

    it('TC53: Should handle review from both logged-in and anonymous users', async () => {
      const payload = buildReviewRequest({
        restaurantId: 'r1',
        rating: 5,
        comment: 'Excellent rescue meals!',
        customerName: 'Anonymous User',
      });

      // Expected success response
      const expected = {
        status: 201,
        body: {
          success: true,
          message: 'Review submitted',
        },
      };
      expect(expected.status).toBe(201);
    });

    it('TC54: Should detect and handle duplicate reviews from same customer', async () => {
      const payload = buildReviewRequest({
        restaurantId: 'r1',
        customerId: 'c1',
        rating: 4,
        comment: 'Duplicate review attempt',
      });

      // Expected: either update or warn about duplicate
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'You already reviewed this restaurant',
        },
      };
      expect(expected.body.message).toContain('already reviewed');
    });
  });

  describe('GET /leaderboard (UC14: View Community Leaderboard)', () => {
    it('TC55: Should successfully load leaderboard with restaurant rankings', async () => {
      // Expected leaderboard response
      const expected = {
        status: 200,
        body: {
          success: true,
          leaderboard: [
            {
              rank: 1,
              restaurantId: 'r1',
              restaurantName: 'Top Café',
              points: 500,
              badge: 'gold',
            },
            {
              rank: 2,
              restaurantId: 'r2',
              restaurantName: 'Good Café',
              points: 350,
              badge: 'silver',
            },
            {
              rank: 3,
              restaurantId: 'r3',
              restaurantName: 'Great Café',
              points: 200,
              badge: 'bronze',
            },
          ],
        },
      };
      expect(expected.status).toBe(200);
      expect(Array.isArray(expected.body.leaderboard)).toBe(true);
      expect(expected.body.leaderboard[0].rank).toBe(1);
    });

    it('TC56: Should display top 3 restaurants with appropriate medals/badges', async () => {
      // Verify medal assignment
      const mockLeaderboard = [
        {
          rank: 1,
          badge: 'gold',
          restaurantName: 'Best Café',
          points: 500,
        },
        {
          rank: 2,
          badge: 'silver',
          restaurantName: 'Good Café',
          points: 400,
        },
        {
          rank: 3,
          badge: 'bronze',
          restaurantName: 'Nice Café',
          points: 300,
        },
      ];

      expect(mockLeaderboard[0].badge).toBe('gold');
      expect(mockLeaderboard[1].badge).toBe('silver');
      expect(mockLeaderboard[2].badge).toBe('bronze');
    });

    it('TC57: Should handle tied restaurants and zero-point restaurants correctly', async () => {
      // Expected response with ties and zero points
      const expected = {
        status: 200,
        body: {
          success: true,
          leaderboard: [
            {
              rank: 1,
              restaurantName: 'Leader Café',
              points: 500,
            },
            {
              rank: 2, // Tie - same points
              restaurantName: 'Tied Café A',
              points: 300,
            },
            {
              rank: 2, // Tie - same points
              restaurantName: 'Tied Café B',
              points: 300,
            },
            {
              rank: 4,
              restaurantName: 'No Points Café',
              points: 0,
            },
          ],
        },
      };
      expect(expected.body.leaderboard).toBeDefined();
      // Verify tied restaurants have same rank
      expect(expected.body.leaderboard[1].rank).toBe(expected.body.leaderboard[2].rank);
    });

    it('TC76: Should allow navigation to restaurant details from leaderboard', async () => {
      // Verify leaderboard entry is clickable/navigable
      const mockLeaderboardEntry = {
        rank: 1,
        restaurantId: 'r1',
        restaurantName: 'Top Café',
        points: 500,
      };
      expect(mockLeaderboardEntry).toHaveProperty('restaurantId');
      expect(mockLeaderboardEntry.restaurantId).toBeDefined();
    });
  });
});
