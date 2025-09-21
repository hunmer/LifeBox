import request from 'supertest';
import { app } from '@/app';
import { getDatabase } from '@/database/connection';

const db = getDatabase();

describe('/api/channels', () => {
  beforeEach(async () => {
    // Clean database before each test
    await db.message.deleteMany({});
    await db.channel.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and disconnect
    await db.message.deleteMany({});
    await db.channel.deleteMany({});
    await db.$disconnect();
  });

  describe('POST /api/channels', () => {
    it('should create a new channel successfully', async () => {
      const channelData = {
        name: 'test-channel',
        description: 'Test channel description'
      };

      const response = await request(app)
        .post('/api/channels')
        .send(channelData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Channel created successfully',
        data: {
          name: 'test-channel',
          description: 'Test channel description'
        }
      });

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should create a channel without description', async () => {
      const channelData = {
        name: 'simple-channel'
      };

      const response = await request(app)
        .post('/api/channels')
        .send(channelData)
        .expect(201);

      expect(response.body.data.name).toBe('simple-channel');
      expect(response.body.data.description).toBeNull();
    });

    it('should return 409 when channel name already exists', async () => {
      const channelData = {
        name: 'duplicate-channel',
        description: 'First channel'
      };

      // Create first channel
      await request(app)
        .post('/api/channels')
        .send(channelData)
        .expect(201);

      // Try to create channel with same name
      const response = await request(app)
        .post('/api/channels')
        .send(channelData)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('already exists')
        }
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/channels')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate field lengths', async () => {
      const channelData = {
        name: 'a'.repeat(101), // Too long
        description: 'b'.repeat(501) // Too long
      };

      const response = await request(app)
        .post('/api/channels')
        .send(channelData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/channels', () => {
    it('should return empty array when no channels exist', async () => {
      const response = await request(app)
        .get('/api/channels')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
        total: 0
      });
    });

    it('should return all channels', async () => {
      // Create test channels
      const channels = [
        { name: 'channel-1', description: 'First channel' },
        { name: 'channel-2', description: 'Second channel' },
        { name: 'channel-3' }
      ];

      for (const channel of channels) {
        await request(app)
          .post('/api/channels')
          .send(channel);
      }

      const response = await request(app)
        .get('/api/channels')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        total: 3
      });

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('createdAt');
    });
  });

  describe('GET /api/channels/:id', () => {
    it('should return channel by ID', async () => {
      // Create a channel
      const createResponse = await request(app)
        .post('/api/channels')
        .send({ name: 'test-channel', description: 'Test description' });

      const channelId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/channels/${channelId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: channelId,
          name: 'test-channel',
          description: 'Test description'
        }
      });
    });

    it('should return 404 for non-existent channel', async () => {
      const response = await request(app)
        .get('/api/channels/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'Channel not found' }
      });
    });
  });

  describe('PUT /api/channels/:id', () => {
    it('should update channel successfully', async () => {
      // Create a channel
      const createResponse = await request(app)
        .post('/api/channels')
        .send({ name: 'original-name', description: 'Original description' });

      const channelId = createResponse.body.data.id;

      // Update the channel
      const updateData = {
        name: 'updated-name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/channels/${channelId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Channel updated successfully',
        data: {
          id: channelId,
          name: 'updated-name',
          description: 'Updated description'
        }
      });
    });

    it('should return 404 when updating non-existent channel', async () => {
      const response = await request(app)
        .put('/api/channels/non-existent-id')
        .send({ name: 'new-name' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'Channel not found' }
      });
    });

    it('should return 409 when updating to existing channel name', async () => {
      // Create two channels
      await request(app)
        .post('/api/channels')
        .send({ name: 'channel-1' });

      const createResponse = await request(app)
        .post('/api/channels')
        .send({ name: 'channel-2' });

      const channelId = createResponse.body.data.id;

      // Try to update second channel to first channel's name
      const response = await request(app)
        .put(`/api/channels/${channelId}`)
        .send({ name: 'channel-1' })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('already exists')
        }
      });
    });
  });

  describe('DELETE /api/channels/:id', () => {
    it('should delete channel successfully', async () => {
      // Create a channel
      const createResponse = await request(app)
        .post('/api/channels')
        .send({ name: 'to-be-deleted', description: 'Will be deleted' });

      const channelId = createResponse.body.data.id;

      // Delete the channel
      const response = await request(app)
        .delete(`/api/channels/${channelId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Channel deleted successfully'
      });

      // Verify channel is actually deleted
      await request(app)
        .get(`/api/channels/${channelId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent channel', async () => {
      const response = await request(app)
        .delete('/api/channels/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'Channel not found' }
      });
    });

    it('should delete channel and cascade delete messages', async () => {
      // Create a channel
      const createChannelResponse = await request(app)
        .post('/api/channels')
        .send({ name: 'channel-with-messages' });

      const channelId = createChannelResponse.body.data.id;

      // Create some messages in the channel
      await request(app)
        .post('/api/messages')
        .send({
          content: 'Test message 1',
          author: 'user1',
          channelId
        });

      await request(app)
        .post('/api/messages')
        .send({
          content: 'Test message 2',
          author: 'user2',
          channelId
        });

      // Delete the channel
      await request(app)
        .delete(`/api/channels/${channelId}`)
        .expect(200);

      // Verify messages are also deleted (cascade)
      const messagesResponse = await request(app)
        .get(`/api/messages?channelId=${channelId}`)
        .expect(404); // Channel not found, so can't get messages

      expect(messagesResponse.body.error.message).toBe('Channel not found');
    });
  });

  describe('Channel validation', () => {
    it('should reject invalid channel names', async () => {
      const invalidNames = [
        '', // empty
        'Channel With Spaces', // spaces
        'channel_with_CAPS', // uppercase
        'channel@with#symbols', // special characters
        '_starts_with_underscore' // starts with underscore
      ];

      for (const name of invalidNames) {
        const response = await request(app)
          .post('/api/channels')
          .send({ name })
          .expect(400);

        expect(response.body.success).toBe(false);
      }
    });

    it('should accept valid channel names', async () => {
      const validNames = [
        'simple',
        'with-hyphens',
        'with_underscores',
        'with123numbers',
        'a', // single character
        'a'.repeat(100) // max length
      ];

      for (const name of validNames) {
        await request(app)
          .post('/api/channels')
          .send({ name })
          .expect(201);

        // Clean up for next iteration
        await db.channel.deleteMany({});
      }
    });
  });
});