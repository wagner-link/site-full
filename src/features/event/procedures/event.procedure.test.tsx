import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventFeatureProcedure } from './event.procedure';

// Mock database context
const mockDatabase = {
  event: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

const mockContext = {
  providers: {
    database: mockDatabase,
  },
};

describe('EventFeatureProcedure', () => {
  let eventService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Get the event service from the procedure
    const procedureResult = EventFeatureProcedure.handler(
      {},
      { context: mockContext } as any
    );
    eventService = (procedureResult as any).event;
  });

  describe('create method', () => {
    it('should create event with valid data', async () => {
      const mockUser = { id: '1', name: 'Test User' };
      const mockCreatedEvent = {
        id: '1',
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue',
        userId: '1',
        user: mockUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabase.user.findUnique.mockResolvedValue(mockUser);
      mockDatabase.event.create.mockResolvedValue(mockCreatedEvent);

      const input = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue' as const,
        userId: '1',
      };

      const result = await eventService.create(input);

      expect(mockDatabase.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockDatabase.event.create).toHaveBeenCalledWith({
        data: input,
        include: { user: true },
      });
      expect(result).toEqual(mockCreatedEvent);
    });

    it('should create event without user', async () => {
      const mockCreatedEvent = {
        id: '1',
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue',
        userId: null,
        user: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDatabase.event.create.mockResolvedValue(mockCreatedEvent);

      const input = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue' as const,
        userId: null,
      };

      const result = await eventService.create(input);

      expect(mockDatabase.user.findUnique).not.toHaveBeenCalled();
      expect(mockDatabase.event.create).toHaveBeenCalledWith({
        data: input,
        include: { user: true },
      });
      expect(result).toEqual(mockCreatedEvent);
    });

    it('should throw error for invalid title', async () => {
      const input = {
        title: '', // Invalid: empty title
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue' as const,
        userId: '1',
      };

      await expect(eventService.create(input)).rejects.toThrow(
        /Dados inválidos.*Título é obrigatório/
      );
    });

    it('should throw error for invalid date format', async () => {
      const input = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: 'invalid-date',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue' as const,
        userId: '1',
      };

      await expect(eventService.create(input)).rejects.toThrow(
        /Dados inválidos.*Data de início deve estar no formato ISO8601/
      );
    });

    it('should throw error when end date is before start date', async () => {
      const input = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T11:00:00.000Z',
        endDate: '2024-01-01T10:00:00.000Z', // End before start
        color: 'blue' as const,
        userId: '1',
      };

      await expect(eventService.create(input)).rejects.toThrow(
        /Dados inválidos.*Data de fim deve ser posterior à data de início/
      );
    });

    it('should throw error when user does not exist', async () => {
      mockDatabase.user.findUnique.mockResolvedValue(null);

      const input = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue' as const,
        userId: 'non-existent-user',
      };

      await expect(eventService.create(input)).rejects.toThrow(
        'Usuário não encontrado'
      );
    });

    it('should handle database errors', async () => {
      const input = {
        title: 'Test Event',
        description: 'Test Description',
        startDate: '2024-01-01T10:00:00.000Z',
        endDate: '2024-01-01T11:00:00.000Z',
        color: 'blue' as const,
        userId: null,
      };

      mockDatabase.event.create.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(eventService.create(input)).rejects.toThrow(
        'Falha ao criar evento'
      );
    });
  });

  describe('findMany method', () => {
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

      mockDatabase.event.findMany.mockResolvedValue(mockEvents);

      const query = { page: 1, limit: 10 };
      const result = await eventService.findMany(query);

      expect(mockDatabase.event.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
        orderBy: undefined,
        include: { user: true },
      });
      expect(result).toEqual(mockEvents);
    });

    it('should handle search queries', async () => {
      const mockEvents = [];
      mockDatabase.event.findMany.mockResolvedValue(mockEvents);

      const query = { search: 'test', page: 1, limit: 5 };
      await eventService.findMany(query);

      expect(mockDatabase.event.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test' } },
            { description: { contains: 'test' } },
            { userId: { contains: 'test' } },
          ],
        },
        skip: 0,
        take: 5,
        orderBy: undefined,
        include: { user: true },
      });
    });

    it('should handle database errors in findMany', async () => {
      mockDatabase.event.findMany.mockRejectedValue(
        new Error('Database error')
      );

      await expect(eventService.findMany({})).rejects.toThrow(
        'Falha ao buscar eventos'
      );
    });
  });

  describe('delete method', () => {
    it('should delete event successfully', async () => {
      const mockEvent = { id: '1', title: 'Test Event' };
      mockDatabase.event.findUnique.mockResolvedValue(mockEvent);
      mockDatabase.event.delete.mockResolvedValue(mockEvent);

      const result = await eventService.delete({ id: '1' });

      expect(mockDatabase.event.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockDatabase.event.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual({ id: '1' });
    });

    it('should throw error when event not found for deletion', async () => {
      mockDatabase.event.findUnique.mockResolvedValue(null);

      await expect(eventService.delete({ id: 'non-existent' })).rejects.toThrow(
        'Evento não encontrado'
      );
    });
  });
});