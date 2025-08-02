import { igniter } from "@/igniter";
import { z } from "zod";
import type {
  Event,
  CreateEventDTO,
  UpdateEventDTO,
  EventQueryParams,
  EventValidationError,
} from "../event.interface";

// Validation schemas
const EventColorEnum = z.enum([
  "blue",
  "green", 
  "red",
  "yellow",
  "purple",
  "orange",
  "gray",
]);

const CreateEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255, "Título deve ter no máximo 255 caracteres"),
  description: z.string().min(1, "Descrição é obrigatória").max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  startDate: z.string().datetime("Data de início deve estar no formato ISO8601"),
  endDate: z.string().datetime("Data de fim deve estar no formato ISO8601"),
  color: EventColorEnum.default("blue"),
  userId: z.string().uuid("ID do usuário deve ser um UUID válido").nullable().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["endDate"],
});

export const EventFeatureProcedure = igniter.procedure({
  name: "EventFeatureProcedure",
  handler: async (_, { context }) => {
    return {
      event: {
        findMany: async (query: EventQueryParams): Promise<Event[]> => {
          try {
          return context.providers.database.event.findMany({
            where: query.search
              ? {
                  OR: [
                    { title: { contains: query.search } },
                    { description: { contains: query.search } },
                    { userId: { contains: query.search } },
                  ],
                }
              : undefined,
            skip: query.page
              ? (query.page - 1) * (query.limit || 10)
              : undefined,
            take: query.limit,
            orderBy: query.sortBy
              ? { [query.sortBy]: query.sortOrder || "asc" }
              : undefined,
              include: {
                user: true, // Include user details for each event
              },
          });
          } catch (error) {
            console.error("Error fetching events:", error);
            throw new Error("Falha ao buscar eventos");
          }
        },
        findOne: async (params: { id: string }): Promise<Event | null> => {
          try {
          return context.providers.database.event.findUnique({
            where: {
              id: params.id,
            },
              include: {
                user: true,
              },
          });
          } catch (error) {
            console.error("Error fetching event:", error);
            throw new Error("Falha ao buscar evento");
          }
        },
        create: async (input: CreateEventDTO): Promise<Event> => {
          try {
            // Validate input data
            const validationResult = CreateEventSchema.safeParse(input);
            if (!validationResult.success) {
              const errors: EventValidationError[] = validationResult.error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                value: err.path.reduce((obj, key) => obj?.[key], input),
              }));
              throw new Error(`Dados inválidos: ${errors.map(e => e.message).join(', ')}`);
            }

            const validatedData = validationResult.data;

            // Validate user exists if userId is provided
            if (validatedData.userId) {
              const userExists = await context.providers.database.user.findUnique({
                where: { id: validatedData.userId },
              });
              if (!userExists) {
                throw new Error("Usuário não encontrado");
              }
            }

            // Validate date logic
            const startDate = new Date(validatedData.startDate);
            const endDate = new Date(validatedData.endDate);
            
            if (startDate >= endDate) {
              throw new Error("Data de fim deve ser posterior à data de início");
            }

            // Create event
          return context.providers.database.event.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate,
                color: validatedData.color,
                userId: validatedData.userId,
            },
              include: {
                user: true,
              },
          });
          } catch (error) {
            console.error("Error creating event:", error);
            if (error instanceof Error) {
              throw error;
            }
            throw new Error("Falha ao criar evento");
          }
        },
        update: async (
          params: { id: string } & UpdateEventDTO
        ): Promise<Event> => {
          try {
          const event = await context.providers.database.event.findUnique({
            where: { id: params.id },
          });
          if (!event) throw new Error("Event not found");

            // Validate user exists if userId is being updated
            if (params.userId !== undefined && params.userId !== null) {
              const userExists = await context.providers.database.user.findUnique({
                where: { id: params.userId },
              });
              if (!userExists) {
                throw new Error("Usuário não encontrado");
              }
            }

          return context.providers.database.event.update({
            where: { id: params.id },
            data: {
              title: params.title,
              description: params.description,
              startDate: params.startDate,
              endDate: params.endDate,
              color: params.color,
              userId: params.userId,
            },
              include: {
                user: true,
              },
          });
          } catch (error) {
            console.error("Error updating event:", error);
            if (error instanceof Error) {
              throw error;
            }
            throw new Error("Falha ao atualizar evento");
          }
        },
        delete: async (params: { id: string }): Promise<{ id: string }> => {
          try {
            const event = await context.providers.database.event.findUnique({
              where: { id: params.id },
            });
            if (!event) {
              throw new Error("Evento não encontrado");
            }

          await context.providers.database.event.delete({
            where: { id: params.id },
          });
          return { id: params.id };
          } catch (error) {
            console.error("Error deleting event:", error);
            if (error instanceof Error) {
              throw error;
            }
            throw new Error("Falha ao excluir evento");
          }
        },
      },
    };
  },
});
