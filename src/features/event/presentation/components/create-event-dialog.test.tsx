import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateEventDialog } from './create-event-dialog';
import { api } from '@/igniter.client';

// Mock dependencies
vi.mock('@/igniter.client', () => ({
  api: {
    event: {
      create: {
        useMutation: vi.fn(() => ({
          mutate: vi.fn(),
          loading: false,
        })),
      },
    },
  },
  useQueryClient: vi.fn(() => ({
    invalidate: vi.fn(),
  })),
}));

vi.mock('@/calendar/contexts/calendar-context', () => ({
  useCalendar: vi.fn(() => ({
    users: [
      { id: '1', name: 'João Silva', picturePath: null },
      { id: '2', name: 'Maria Santos', picturePath: null },
    ],
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('CreateEventDialog', () => {
  const mockMutate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (api.event.create.useMutation as any).mockReturnValue({
      mutate: mockMutate,
      loading: false,
    });
  });

  it('should render form fields correctly', () => {
    render(
      <CreateEventDialog>
        <button>Open Dialog</button>
      </CreateEventDialog>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    expect(screen.getByLabelText(/título do evento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/funcionário responsável/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data de início/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hora de início/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data de fim/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hora de fim/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cor do evento/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <CreateEventDialog>
        <button>Open Dialog</button>
      </CreateEventDialog>
    );

    fireEvent.click(screen.getByText('Open Dialog'));
    fireEvent.click(screen.getByText('Criar Evento'));

    await waitFor(() => {
      expect(screen.getByText(/título é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/descrição é obrigatória/i)).toBeInTheDocument();
    });
  });

  it('should validate date and time logic', async () => {
    render(
      <CreateEventDialog>
        <button>Open Dialog</button>
      </CreateEventDialog>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    // Fill form with invalid date/time combination
    fireEvent.change(screen.getByLabelText(/título do evento/i), {
      target: { value: 'Test Event' },
    });
    fireEvent.change(screen.getByLabelText(/descrição/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.change(screen.getByLabelText(/hora de início/i), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByLabelText(/hora de fim/i), {
      target: { value: '09:00' },
    });

    fireEvent.click(screen.getByText('Criar Evento'));

    await waitFor(() => {
      expect(screen.getByText(/data e hora de fim devem ser posteriores ao início/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockResponse = {
      data: {
        event: {
          id: '1',
          title: 'Test Event',
          description: 'Test Description',
          startDate: '2024-01-01T10:00:00.000Z',
          endDate: '2024-01-01T11:00:00.000Z',
          color: 'blue',
          userId: '1',
          user: { id: '1', name: 'João Silva' },
        },
      },
    };

    mockMutate.mockResolvedValue(mockResponse);

    render(
      <CreateEventDialog>
        <button>Open Dialog</button>
      </CreateEventDialog>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/título do evento/i), {
      target: { value: 'Test Event' },
    });
    fireEvent.change(screen.getByLabelText(/descrição/i), {
      target: { value: 'Test Description' },
    });
    fireEvent.change(screen.getByLabelText(/hora de início/i), {
      target: { value: '10:00' },
    });
    fireEvent.change(screen.getByLabelText(/hora de fim/i), {
      target: { value: '11:00' },
    });

    fireEvent.click(screen.getByText('Criar Evento'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        body: expect.objectContaining({
          title: 'Test Event',
          description: 'Test Description',
          color: 'blue',
        }),
      });
    });
  });

  it('should handle API errors gracefully', async () => {
    mockMutate.mockRejectedValue(new Error('API Error'));

    render(
      <CreateEventDialog>
        <button>Open Dialog</button>
      </CreateEventDialog>
    );

    fireEvent.click(screen.getByText('Open Dialog'));

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText(/título do evento/i), {
      target: { value: 'Test Event' },
    });
    fireEvent.change(screen.getByLabelText(/descrição/i), {
      target: { value: 'Test Description' },
    });

    fireEvent.click(screen.getByText('Criar Evento'));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalled();
    });
  });
});