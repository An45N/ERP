import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import axios from 'axios';

vi.mock('axios');

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(axios.get).mockResolvedValue({ data: mockData });

      const response = await api.get('/test');
      expect(response.data).toEqual(mockData);
      expect(axios.get).toHaveBeenCalledWith('/test', expect.any(Object));
    });

    it('should handle GET request errors', async () => {
      const error = new Error('Network error');
      vi.mocked(axios.get).mockRejectedValue(error);

      await expect(api.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { id: 1, name: 'Created' };
      const payload = { name: 'Test' };
      vi.mocked(axios.post).mockResolvedValue({ data: mockData });

      const response = await api.post('/test', payload);
      expect(response.data).toEqual(mockData);
      expect(axios.post).toHaveBeenCalledWith('/test', payload, expect.any(Object));
    });

    it('should handle POST request errors', async () => {
      const error = new Error('Validation error');
      vi.mocked(axios.post).mockRejectedValue(error);

      await expect(api.post('/test', {})).rejects.toThrow('Validation error');
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const payload = { name: 'Updated' };
      vi.mocked(axios.put).mockResolvedValue({ data: mockData });

      const response = await api.put('/test/1', payload);
      expect(response.data).toEqual(mockData);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      vi.mocked(axios.delete).mockResolvedValue({ data: { success: true } });

      const response = await api.delete('/test/1');
      expect(response.data).toEqual({ success: true });
    });
  });

  describe('Request interceptors', () => {
    it('should add authorization header when token exists', async () => {
      localStorage.setItem('token', 'test-token');
      vi.mocked(axios.get).mockResolvedValue({ data: {} });

      await api.get('/test');
      
      expect(axios.get).toHaveBeenCalledWith(
        '/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      localStorage.removeItem('token');
    });
  });
});
