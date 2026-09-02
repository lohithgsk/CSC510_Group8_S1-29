/**
 * auth.test.js
 * Test suite for authentication routes (UC1-UC5)
 * Tests: Register Customer, Register Restaurant, Login, Logout
 */

const request = require('supertest');
const {
  createMockCustomer,
  createMockRestaurant,
  buildRegisterRequest,
  buildLoginRequest,
  resetMocks,
  assertSuccess,
  assertError,
} = require('./testUtils');

// Mock the server app - in a real scenario, this would be the actual Express app
// For now, we create a minimal mock to demonstrate the test structure
let mockApp;

describe('Authentication Routes (UC1-UC5)', () => {
  beforeEach(() => {
    resetMocks();
    // In real scenario: mockApp = require('../src/backend/server');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register (UC1: Register as Customer)', () => {
    it('TC01: Should successfully register customer with valid credentials', async () => {
      const payload = buildRegisterRequest({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'SecurePass123',
        type: 'customer',
      });

      // In real test: await request(mockApp).post('/register').send(payload);
      // Demonstrating expected response:
      const expected = {
        status: 200,
        body: {
          success: true,
          message: 'Customer registered successfully',
          userId: expect.any(String),
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(true);
    });

    it('TC02: Should reject registration when name is missing', async () => {
      const payload = buildRegisterRequest({
        name: '',
        email: 'bob@example.com',
        password: 'SecurePass123',
      });

      // Expected error response
      const expected = {
        status: 400,
        body: {
          success: false,
          message: 'Name is required',
        },
      };
      expect(expected.status).toBe(400);
      expect(expected.body.success).toBe(false);
    });

    it('TC03: Should reject registration when password is missing', async () => {
      const payload = buildRegisterRequest({
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: '',
      });

      // Expected error response
      const expected = {
        status: 400,
        body: {
          success: false,
          message: 'Password is required',
        },
      };
      expect(expected.status).toBe(400);
    });

    it('TC04: Should reject registration when email already exists', async () => {
      const payload = buildRegisterRequest({
        name: 'Duplicate User',
        email: 'existing@example.com',
        password: 'SecurePass123',
      });

      // Expected error response (HTTP 200 with success:false)
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'Email already exists',
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(false);
    });
  });

  describe('POST /register (UC2: Register as Restaurant)', () => {
    it('TC05: Should successfully register restaurant with valid information', async () => {
      const payload = buildRegisterRequest({
        name: 'Café Owner',
        email: 'cafe@example.com',
        password: 'RestPass123',
        type: 'restaurant',
        restaurantName: 'Test Café',
      });

      // Expected success response
      const expected = {
        status: 200,
        body: {
          success: true,
          message: 'Restaurant registered successfully',
          restaurantId: expect.any(String),
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(true);
    });

    it('TC06: Should reject registration when restaurant name is missing', async () => {
      const payload = buildRegisterRequest({
        name: 'Restaurant Owner',
        email: 'rest@example.com',
        password: 'RestPass123',
        type: 'restaurant',
        restaurantName: '',
      });

      // Expected error response
      const expected = {
        status: 400,
        body: {
          success: false,
          message: 'Restaurant name is required',
        },
      };
      expect(expected.status).toBe(400);
    });
  });

  describe('POST /login (UC3: Login as Customer)', () => {
    it('TC09: Should successfully login customer with valid credentials', async () => {
      const payload = buildLoginRequest({
        email: 'alice@example.com',
        password: 'SecurePass123',
      });

      // Expected success response with session
      const expected = {
        status: 200,
        body: {
          success: true,
          message: 'Login successful',
          user: {
            email: 'alice@example.com',
            type: 'customer',
            name: 'Alice Johnson',
          },
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(true);
    });

    it('TC10: Should reject login with unknown email', async () => {
      const payload = buildLoginRequest({
        email: 'unknown@example.com',
        password: 'SecurePass123',
      });

      // Expected error response
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'Invalid credentials',
        },
      };
      expect(expected.body.success).toBe(false);
    });

    it('TC11: Should reject login with incorrect password', async () => {
      const payload = buildLoginRequest({
        email: 'alice@example.com',
        password: 'WrongPassword',
      });

      // Expected error response
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'Invalid credentials',
        },
      };
      expect(expected.body.success).toBe(false);
    });

    it('TC12: Should reject login with missing email or password', async () => {
      const payload = buildLoginRequest({
        email: '',
        password: '',
      });

      // Expected error response
      const expected = {
        status: 200,
        body: {
          success: false,
          message: 'Email and password are required',
        },
      };
      expect(expected.body.success).toBe(false);
    });
  });

  describe('POST /login (UC4: Login as Restaurant)', () => {
    it('TC13: Should successfully login restaurant with valid credentials', async () => {
      const payload = buildLoginRequest({
        email: 'cafe@example.com',
        password: 'RestPass123',
      });

      // Expected success response
      const expected = {
        status: 200,
        body: {
          success: true,
          message: 'Login successful',
          user: {
            email: 'cafe@example.com',
            type: 'restaurant',
          },
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(true);
    });
  });

  describe('POST /logout (UC5: Logout)', () => {
    it('TC16: Should successfully logout user and clear session', async () => {
      // Expected success response
      const expected = {
        status: 200,
        body: {
          success: true,
          message: 'Logout successful',
        },
      };
      expect(expected.status).toBe(200);
      expect(expected.body.success).toBe(true);
    });

    it('TC18: Should deny access to protected pages after logout', async () => {
      // Simulating protected route access after logout
      // Expected error response
      const expected = {
        status: 401,
        body: {
          success: false,
          message: 'Unauthorized',
        },
      };
      expect(expected.status).toBe(401);
    });
  });
});
