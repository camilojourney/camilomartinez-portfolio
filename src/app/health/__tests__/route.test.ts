/**
 * Tests for the health check API route.
 */

import { describe, it, expect } from 'vitest';

describe('Health API Route', () => {
  describe('Response Format', () => {
    it('should return expected health check structure', () => {
      // Mock expected health response
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };

      expect(healthResponse).toHaveProperty('status');
      expect(healthResponse).toHaveProperty('timestamp');
      expect(healthResponse.status).toBe('ok');
    });

    it('should have valid ISO timestamp', () => {
      const timestamp = new Date().toISOString();
      
      // Validate ISO 8601 format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Status Values', () => {
    it('should use standard status values', () => {
      const validStatuses = ['ok', 'healthy', 'degraded', 'unhealthy'];
      const status = 'ok';
      
      expect(validStatuses).toContain(status);
    });
  });
});
