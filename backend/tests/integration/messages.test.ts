import request from 'supertest';
import { app } from '@/app';
import { getDatabase } from '@/database/connection';

const db = getDatabase();

describe('/api/messages', () => {
  let testChannelId: string;

  beforeEach(async () => {
    // Clean database before each test
    await db.message.deleteMany({});
    await db.channel.deleteMany({});

    // Create a test channel for messages
    const channelResponse = await request(app)
      .post('/api/channels')
      .send({ name: 'test-channel', description: 'Test channel for messages' });

    testChannelId = channelResponse.body.data.id;
  });

  afterAll(async () => {
    // Clean up and disconnect
    await db.message.deleteMany({});
    await db.channel.deleteMany({});
    await db.$disconnect();
  });

  describe('POST /api/messages', () => {
    it('should create a new message successfully', async () => {
      const messageData = {
        content: 'Hello, World!',
        author: 'testuser',
        type: 'text',
        channelId: testChannelId
      };

      const response = await request(app)
        .post('/api/messages')
        .send(messageData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Message created successfully',
        data: {
          content: 'Hello, World!',
          author: 'testuser',
          type: 'text',
          channelId: testChannelId
        }
      });

      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should create message with different types', async () => {
      const messageTypes = ['text', 'image', 'file'];

      for (const type of messageTypes) {
        const messageData = {
          content: `Content for ${type}`,
          author: 'testuser',
          type,
          channelId: testChannelId
        };

        const response = await request(app)
          .post('/api/messages')
          .send(messageData)
          .expect(201);

        expect(response.body.data.type).toBe(type);
      }
    });

    it('should default to text type when not specified', async () => {
      const messageData = {
        content: 'Default type message',
        author: 'testuser',
        channelId: testChannelId
        // type not specified
      };

      const response = await request(app)
        .post('/api/messages')
        .send(messageData)
        .expect(201);

      expect(response.body.data.type).toBe('text');
    });

    it('should return 404 when channel does not exist', async () => {
      const messageData = {
        content: 'Message for non-existent channel',
        author: 'testuser',
        channelId: 'non-existent-channel-id'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(messageData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('does not exist')
        }
      });
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        content: 'Missing author and channelId'
      };

      const response = await request(app)
        .post('/api/messages')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate field lengths', async () => {
      const messageData = {
        content: 'a'.repeat(2001), // Too long
        author: 'b'.repeat(101), // Too long
        channelId: testChannelId
      };

      const response = await request(app)
        .post('/api/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate message type', async () => {
      const messageData = {
        content: 'Invalid type message',
        author: 'testuser',
        type: 'invalid-type',
        channelId: testChannelId
      };

      const response = await request(app)
        .post('/api/messages')
        .send(messageData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/messages', () => {
    beforeEach(async () => {
      // Create test messages
      const messages = [
        { content: 'First message', author: 'user1', channelId: testChannelId },
        { content: 'Second message', author: 'user2', channelId: testChannelId },
        { content: 'Third message', author: 'user1', channelId: testChannelId }
      ];

      for (const message of messages) {
        await request(app)
          .post('/api/messages')
          .send(message);
      }
    });

    it('should return messages for a channel', async () => {
      const response = await request(app)
        .get(`/api/messages?channelId=${testChannelId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        pagination: {
          limit: 50,
          page: 1,
          total: 3,
          totalPages: 1
        }
      });

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('content');
      expect(response.body.data[0]).toHaveProperty('author');
      expect(response.body.data[0]).toHaveProperty('timestamp');
    });

    it('should return 400 when channelId is missing', async () => {
      const response = await request(app)
        .get('/api/messages')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'channelId is required' }
      });
    });

    it('should return 404 when channel does not exist', async () => {
      const response = await request(app)
        .get('/api/messages?channelId=non-existent-channel')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'Channel not found' }
      });
    });

    it('should support pagination', async () => {
      // Create more messages for pagination testing
      const additionalMessages = Array.from({ length: 15 }, (_, i) => ({
        content: `Message ${i + 4}`,
        author: 'testuser',
        channelId: testChannelId
      }));

      for (const message of additionalMessages) {
        await request(app)
          .post('/api/messages')
          .send(message);
      }

      // Test first page
      const firstPageResponse = await request(app)
        .get(`/api/messages?channelId=${testChannelId}&limit=10&page=1`)
        .expect(200);

      expect(firstPageResponse.body.data).toHaveLength(10);
      expect(firstPageResponse.body.pagination).toMatchObject({
        limit: 10,
        page: 1,
        total: 18,
        totalPages: 2
      });

      // Test second page
      const secondPageResponse = await request(app)
        .get(`/api/messages?channelId=${testChannelId}&limit=10&page=2`)
        .expect(200);

      expect(secondPageResponse.body.data).toHaveLength(8);
      expect(secondPageResponse.body.pagination.page).toBe(2);
    });

    it('should return empty array for channel with no messages', async () => {
      // Create another channel
      const emptyChannelResponse = await request(app)
        .post('/api/channels')
        .send({ name: 'empty-channel' });

      const emptyChannelId = emptyChannelResponse.body.data.id;

      const response = await request(app)
        .get(`/api/messages?channelId=${emptyChannelId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
        pagination: {
          total: 0,
          totalPages: 0
        }
      });
    });
  });

  describe('GET /api/messages/:id', () => {
    it('should return message by ID', async () => {
      // Create a message
      const createResponse = await request(app)
        .post('/api/messages')
        .send({
          content: 'Test message for retrieval',
          author: 'testuser',
          channelId: testChannelId
        });

      const messageId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/messages/${messageId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: messageId,
          content: 'Test message for retrieval',
          author: 'testuser',
          channelId: testChannelId
        }
      });
    });

    it('should return 404 for non-existent message', async () => {
      const response = await request(app)
        .get('/api/messages/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'Message not found' }
      });
    });
  });

  describe('PUT /api/messages/:id', () => {
    it('should update message successfully', async () => {
      // Create a message
      const createResponse = await request(app)
        .post('/api/messages')
        .send({
          content: 'Original content',
          author: 'testuser',
          channelId: testChannelId
        });

      const messageId = createResponse.body.data.id;

      // Update the message
      const updateData = {
        content: 'Updated content',
        type: 'image'
      };

      const response = await request(app)
        .put(`/api/messages/${messageId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Message updated successfully',
        data: {
          id: messageId,
          content: 'Updated content',
          type: 'image',
          author: 'testuser' // Should remain unchanged
        }
      });
    });

    it('should return 404 when updating non-existent message', async () => {
      const response = await request(app)
        .put('/api/messages/non-existent-id')
        .send({ content: 'Updated content' })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'Message not found' }
      });
    });

    it('should validate update data', async () => {
      // Create a message
      const createResponse = await request(app)
        .post('/api/messages')
        .send({
          content: 'Test message',
          author: 'testuser',
          channelId: testChannelId
        });

      const messageId = createResponse.body.data.id;

      // Try to update with invalid data
      const response = await request(app)
        .put(`/api/messages/${messageId}`)
        .send({
          content: 'a'.repeat(2001), // Too long
          type: 'invalid-type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/messages/:id', () => {
    it('should delete message successfully', async () => {
      // Create a message
      const createResponse = await request(app)
        .post('/api/messages')
        .send({
          content: 'Message to be deleted',
          author: 'testuser',
          channelId: testChannelId
        });

      const messageId = createResponse.body.data.id;

      // Delete the message
      const response = await request(app)
        .delete(`/api/messages/${messageId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Message deleted successfully'
      });

      // Verify message is actually deleted
      await request(app)
        .get(`/api/messages/${messageId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent message', async () => {
      const response = await request(app)
        .delete('/api/messages/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: { message: 'Message not found' }
      });
    });
  });

  describe('Message ordering', () => {
    it('should return messages in chronological order', async () => {
      // Create messages with delays to ensure different timestamps
      const messages = [
        { content: 'First message', author: 'user1' },
        { content: 'Second message', author: 'user2' },
        { content: 'Third message', author: 'user3' }
      ];

      const messageIds = [];

      for (const message of messages) {
        const response = await request(app)
          .post('/api/messages')
          .send({ ...message, channelId: testChannelId });
        
        messageIds.push(response.body.data.id);
        
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const response = await request(app)
        .get(`/api/messages?channelId=${testChannelId}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      
      // Messages should be in ascending order (oldest first)
      const timestamps = response.body.data.map((msg: any) => new Date(msg.timestamp).getTime());
      
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });
  });

  describe('Message content validation', () => {
    it('should reject empty message content', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          content: '',
          author: 'testuser',
          channelId: testChannelId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject message content that is too long', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({
          content: 'a'.repeat(2001),
          author: 'testuser',
          channelId: testChannelId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept message content at maximum length', async () => {
      const maxContent = 'a'.repeat(2000);

      const response = await request(app)
        .post('/api/messages')
        .send({
          content: maxContent,
          author: 'testuser',
          channelId: testChannelId
        })
        .expect(201);

      expect(response.body.data.content).toBe(maxContent);
    });
  });
});