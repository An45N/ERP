import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockApi } = vi.hoisted(() => {
  return {
    mockApi: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    },
  };
});

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockApi),
    },
  };
});

import { api } from '../api';

describe('API Integration Tests', () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.put.mockReset();
    mockApi.delete.mockReset();

    localStorage.clear();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockApi.get.mockResolvedValue({ data: mockData });

      const response = await api.get('/test');
      expect(response.data).toEqual(mockData);
      expect(mockApi.get).toHaveBeenCalledWith('/test');
    });

    it('should handle GET request errors', async () => {
      const error = new Error('Network error');
      mockApi.get.mockRejectedValue(error);

      await expect(api.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockData = { id: 1, name: 'Created' };
      const payload = { name: 'Test' };
      mockApi.post.mockResolvedValue({ data: mockData });

      const response = await api.post('/test', payload);
      expect(response.data).toEqual(mockData);
      expect(mockApi.post).toHaveBeenCalledWith('/test', payload);
    });

    it('should handle POST request errors', async () => {
      const error = new Error('Validation error');
      mockApi.post.mockRejectedValue(error);

      await expect(api.post('/test', {})).rejects.toThrow('Validation error');
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const payload = { name: 'Updated' };
      mockApi.put.mockResolvedValue({ data: mockData });

      const response = await api.put('/test/1', payload);
      expect(response.data).toEqual(mockData);
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      mockApi.delete.mockResolvedValue({ data: { success: true } });

      const response = await api.delete('/test/1');
      expect(response.data).toEqual({ success: true });
    });
  });

  describe('Request interceptors wiring', () => {
    it('should register request + response interceptors on init', () => {
      expect(mockApi.interceptors.request.use).toHaveBeenCalledTimes(1);
      expect(mockApi.interceptors.response.use).toHaveBeenCalledTimes(1);
    });

    it('should add Authorization header when token exists (even if headers missing)', async () => {
      const requestInterceptor = mockApi.interceptors.request.use.mock.calls[0]?.[0];
      expect(requestInterceptor).toBeTypeOf('function');

      localStorage.setItem('token', 'test-token');

      const cfg = await requestInterceptor({ headers: undefined });
      expect((cfg.headers as any).Authorization).toBe('Bearer test-token');
    });

    it('should not modify headers when token does not exist', async () => {
      const requestInterceptor = mockApi.interceptors.request.use.mock.calls[0]?.[0];
      expect(requestInterceptor).toBeTypeOf('function');

      const cfg = await requestInterceptor({ headers: undefined });
      expect(cfg.headers).toBeUndefined();
    });

    it('should clear auth and redirect to /login on 401 responses', async () => {
      const responseErrorInterceptor = mockApi.interceptors.response.use.mock.calls[0]?.[1];
      expect(responseErrorInterceptor).toBeTypeOf('function');

      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', '{"id":"u1"}');

      await expect(
        responseErrorInterceptor({ response: { status: 401 } })
      ).rejects.toBeDefined();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should not redirect on non-401 responses', async () => {
      const responseErrorInterceptor = mockApi.interceptors.response.use.mock.calls[0]?.[1];
      expect(responseErrorInterceptor).toBeTypeOf('function');

      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', '{"id":"u1"}');

      await expect(
        responseErrorInterceptor({ response: { status: 500 } })
      ).rejects.toBeDefined();

      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('user')).toBe('{"id":"u1"}');
    });
  });
});
