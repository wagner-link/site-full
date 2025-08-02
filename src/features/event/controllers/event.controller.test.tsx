import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventController } from './event.controller';

// Mock dependencies
const mockContext = {
  event: {
    create: vi.fn(),
    findMany: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const mockResponse = {
  success: vi.fn(),
  created: vi.fn(),
  badRequest: vi.fn(),
  notFound: vi.fn(),
  status: vi.fn(() => ({ json: vi.fn() })),
};

describe('EventController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create action', () => {
    it('should create event successfully with valid data', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue',
        userId: '1',
        user: { id: '1', name: 'Test User' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContext.event.create.mockResolvedValue(mockEvent);
      mockResponse.created.mockReturnValue({ status: 201, data: mockEvent });

      const request = {
        body: {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-01-01T10:00:00.000Z',
          endDate: '2024-01-01T11:00:00.000Z',
          color: 'blue',
          userId: '1',
        },
      };

      const result = await EventController.actions.create.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockContext.event.create).toHaveBeenCalledWith(request.body);
      expect(mockResponse.created).toHaveBeenCalledWith({
        event: mockEvent,
        message: 'Evento criado com sucesso!',
        status: 201,
      });
    });

    it('should handle validation errors', async () => {
      const request = {
        body: {
          title: '', // Invalid: empty title
          description: 'Test Description',
          startDate: 'invalid-date', // Invalid: not ISO8601
          endDate: '2024-01-01T11:00:00.000Z',
          color: 'blue',
          userId: '1',
        },
      };

      // The validation should happen in the procedure, so we mock that error
      mockContext.event.create.mockRejectedValue(
        new Error('Dados inválidos: Título é obrigatório, Data de início deve estar no formato ISO8601')
      );

      await EventController.actions.create.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockResponse.badRequest).toHaveBeenCalledWith(
        'Dados inválidos: Título é obrigatório, Data de início deve estar no formato ISO8601'
      );
    });

    it('should handle user not found error', async () => {
      const request = {
        body: {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-01-01T10:00:00.000Z',
          endDate: '2024-01-01T11:00:00.000Z',
          color: 'blue',
          userId: 'non-existent-user',
        },
      };

      mockContext.event.create.mockRejectedValue(
        new Error('Usuário não encontrado')
      );

      await EventController.actions.create.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockResponse.badRequest).toHaveBeenCalledWith(
        'Usuário selecionado não existe'
      );
    });

    it('should handle date logic validation error', async () => {
      const request = {
        body: {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-01-01T11:00:00.000Z',
          endDate: '2024-01-01T10:00:00.000Z', // End before start
          color: 'blue',
          userId: '1',
        },
      };

      mockContext.event.create.mockRejectedValue(
        new Error('Data de fim deve ser posterior à data de início')
      );

      await EventController.actions.create.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockResponse.badRequest).toHaveBeenCalledWith(
        'Data de fim deve ser posterior à data de início'
      );
    });

    it('should handle unexpected errors', async () => {
      const request = {
        body: {
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-01-01T10:00:00.000Z',
          endDate: '2024-01-01T11:00:00.000Z',
          color: 'blue',
          userId: '1',
        },
      };

      mockContext.event.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      const mockStatusResponse = { json: vi.fn() };
      mockResponse.status.mockReturnValue(mockStatusResponse);

      await EventController.actions.create.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockStatusResponse.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor ao criar evento',
        message: 'Tente novamente em alguns instantes',
      });
    });
  });

  describe('findMany action', () => {
    it('should fetch events successfully', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Event 1',
          description: 'Description 1',
          startDate: '2024-01-01T10:00:00.000Z',
          endDate: '2024-01-01T11:00:00.000Z',
          color: 'blue',
          userId: '1',
        },
      ];

      mockContext.event.findMany.mockResolvedValue(mockEvents);

      const request = {
        query: {
          page: 1,
          limit: 10,
        },
      };

      await EventController.actions.findMany.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockContext.event.findMany).toHaveBeenCalledWith(request.query);
      expect(mockResponse.success).toHaveBeenCalledWith(mockEvents);
    });

    it('should handle fetch errors', async () => {
      mockContext.event.findMany.mockRejectedValue(
        new Error('Database error')
      );

      const request = { query: {} };

      await EventController.actions.findMany.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockResponse.badRequest).toHaveBeenCalledWith('Database error');
    });
  });

  describe('findOne action', () => {
    it('should fetch single event successfully', async () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue',
        userId: '1',
      };

      mockContext.event.findOne.mockResolvedValue(mockEvent);

      const request = {
        params: { id: '1' },
      };

      await EventController.actions.findOne.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockContext.event.findOne).toHaveBeenCalledWith(request.params);
      expect(mockResponse.success).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle event not found', async () => {
      mockContext.event.findOne.mockResolvedValue(null);

      const request = {
        params: { id: 'non-existent' },
      };

      await EventController.actions.findOne.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockResponse.notFound).toHaveBeenCalledWith('Evento não encontrado');
    });
  });

  describe('delete action', () => {
    it('should delete event successfully', async () => {
      mockContext.event.delete.mockResolvedValue({ id: '1' });

      const request = {
        params: { id: '1' },
      };

      await EventController.actions.delete.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockContext.event.delete).toHaveBeenCalledWith(request.params);
      expect(mockResponse.success).toHaveBeenCalledWith({
        message: 'Evento excluído com sucesso!',
        id: '1',
      });
    });

    it('should handle delete errors', async () => {
      mockContext.event.delete.mockRejectedValue(
        new Error('Evento não encontrado')
      );

      const request = {
        params: { id: 'non-existent' },
      };

      await EventController.actions.delete.handler({
        request,
        response: mockResponse,
        context: mockContext,
      } as any);

      expect(mockResponse.badRequest).toHaveBeenCalledWith('Evento não encontrado');
    });
  });
});