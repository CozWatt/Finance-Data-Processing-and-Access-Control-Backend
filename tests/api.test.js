const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const { User } = require('../src/models/User');
const { FinancialRecord } = require('../src/models/FinancialRecord');

// Use a separate test DB
const TEST_DB = 'mongodb://localhost:27017/finance_test';

let adminToken;
let analystToken;
let viewerToken;
let recordId;

beforeAll(async () => {
  await mongoose.connect(TEST_DB);

  // Clean up
  await User.deleteMany({});
  await FinancialRecord.deleteMany({});

  // Seed users
  await User.create([
    { name: 'Admin User', email: 'admin@test.com', password: 'Admin@123', role: 'admin' },
    { name: 'Analyst User', email: 'analyst@test.com', password: 'Analyst@123', role: 'analyst' },
    { name: 'Viewer User', email: 'viewer@test.com', password: 'Viewer@123', role: 'viewer' },
  ]);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe('Auth', () => {
  test('POST /api/auth/login — valid admin credentials return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    adminToken = res.body.data.token;
  });

  test('POST /api/auth/login — invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me — returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('admin@test.com');
    expect(res.body.data.password).toBeUndefined(); // password never returned
  });

  test('GET /api/auth/me — no token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

// ─── User Management Tests ────────────────────────────────────────────────────

describe('Users', () => {
  test('GET /api/users — admin can list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/users — viewer gets 403', async () => {
    // Login as viewer first
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'viewer@test.com', password: 'Viewer@123' });
    viewerToken = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('POST /api/users — admin can create user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New User', email: 'new@test.com', password: 'Pass@123', role: 'viewer' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.email).toBe('new@test.com');
  });

  test('POST /api/users — validation fails with bad email', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad', email: 'not-an-email', password: '123456' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors).toBeDefined();
  });
});

// ─── Financial Records Tests ──────────────────────────────────────────────────

describe('Records', () => {
  test('POST /api/records — admin can create record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 5000,
        type: 'income',
        category: 'salary',
        date: '2024-01-15',
        notes: 'January salary',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.amount).toBe(5000);
    recordId = res.body.data._id;
  });

  test('POST /api/records — viewer gets 403', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ amount: 100, type: 'expense', category: 'food' });

    expect(res.statusCode).toBe(403);
  });

  test('GET /api/records — viewer can list records', async () => {
    const res = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/records — supports filtering by type', async () => {
    const res = await request(app)
      .get('/api/records?type=income')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(200);
    res.body.data.forEach((r) => expect(r.type).toBe('income'));
  });

  test('PUT /api/records/:id — admin can update record', async () => {
    const res = await request(app)
      .put(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Updated note' });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.notes).toBe('Updated note');
  });

  test('DELETE /api/records/:id — admin can soft delete', async () => {
    const res = await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);

    // Verify it's gone from normal queries
    const getRes = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.statusCode).toBe(404);
  });
});

// ─── Dashboard Tests ──────────────────────────────────────────────────────────

describe('Dashboard', () => {
  test('GET /api/dashboard/summary — analyst can access', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@test.com', password: 'Analyst@123' });
    analystToken = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalIncome');
    expect(res.body.data).toHaveProperty('totalExpenses');
    expect(res.body.data).toHaveProperty('netBalance');
  });

  test('GET /api/dashboard/summary — viewer gets 403', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.statusCode).toBe(403);
  });

  test('GET /api/dashboard/monthly — returns 12 months', async () => {
    const res = await request(app)
      .get('/api/dashboard/monthly?year=2024')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.months).toHaveLength(12);
  });
});
