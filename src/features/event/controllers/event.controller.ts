import { z } from "zod";
import { igniter } from "@/igniter";
import { EventFeatureProcedure } from "../procedures/event.procedure";
// import { auth } from "@/features/admin/procedures/auth.procedure";

// Zod schema for EventColor enum
const EventColorEnum = z.enum([
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "orange",
  "gray",
]);

// Enhanced validation schema for event creation
const CreateEventBodySchema = z.object({
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

export const EventController = igniter.controller({
  name: "event",
  path: "/event",
  actions: {
    findMany: igniter.query({
      method: "GET",
      path: "/",
      use: [EventFeatureProcedure()],
      query: z.object({
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        search: z.string().optional(),
      }),
      handler: async ({ response, request, context }) => {
        try {
          const result = await context.event.findMany(request.query);
          return response.success(result);
        } catch (error) {
          console.error("Error in findMany events:", error);
          return response.badRequest(error instanceof Error ? error.message : "Falha ao buscar eventos");
        }
      },
    }),
    findOne: igniter.query({
      method: "GET",
      path: "/:id" as const,
      use: [EventFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          const result = await context.event.findOne(request.params);
          if (!result) {
            return response.notFound("Evento não encontrado");
          }
          return response.success(result);
        } catch (error) {
          console.error("Error in findOne event:", error);
          return response.badRequest(error instanceof Error ? error.message : "Falha ao buscar evento");
        }
      },
    }),
    create: igniter.mutation({
      method: "POST",
      path: "/",
      use: [EventFeatureProcedure()],
      body: CreateEventBodySchema,
      handler: async ({ request, response, context }) => {
        try {
          const result = await context.event.create(request.body);
          
          return response.created({
            event: result,
            message: "Evento criado com sucesso!",
            status: 201,
          });
        } catch (error) {
          console.error("Error in create event:", error);
          
          if (error instanceof Error) {
            // Handle specific validation errors
            if (error.message.includes("Dados inválidos")) {
              return response.badRequest(error.message);
            }
            if (error.message.includes("Usuário não encontrado")) {
              return response.badRequest("Usuário selecionado não existe");
            }
            if (error.message.includes("Data de fim deve ser posterior")) {
              return response.badRequest("Data de fim deve ser posterior à data de início");
            }
            
            return response.badRequest(error.message);
          }
          
          return response.status(500).json({
            error: "Erro interno do servidor ao criar evento",
            message: "Tente novamente em alguns instantes",
          });
        }
      },
    }),
    update: igniter.mutation({
      method: "PUT",
      path: "/:id" as const,
      use: [EventFeatureProcedure()],
      body: z.object({
        title: z.string().min(1, "Title is required").optional(),
        description: z.string().min(1, "Description is required").optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        color: EventColorEnum.optional(),
        userId: z.string().uuid().nullable().optional(),
      }),
      handler: async ({ request, response, context }) => {
        try {
          const updateData = {
            ...request.params,
            ...request.body,
          };

          const result = await context.event.update(updateData);
          return response.success({
            event: result,
            message: "Evento atualizado com sucesso!",
          });
        } catch (error) {
          console.error("Error in update event:", error);
          return response.badRequest(error instanceof Error ? error.message : "Falha ao atualizar evento");
        }
      },
    }),
    delete: igniter.mutation({
      method: "DELETE",
      path: "/:id" as const,
      use: [EventFeatureProcedure()],
      handler: async ({ request, response, context }) => {
        try {
          await context.event.delete(request.params);
          return response.success({
            message: "Evento excluído com sucesso!",
            id: request.params.id,
          });
        } catch (error) {
          console.error("Error in delete event:", error);
          return response.badRequest(error instanceof Error ? error.message : "Falha ao excluir evento");
        }
      },
    }),
  },
});
