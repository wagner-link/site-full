"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { api, useQueryClient } from "@/igniter.client";
import { useFormWithZod } from "@/hooks/use-form-with-zod";
import { tryCatch } from "@/lib/utils";
import { useCalendar } from "@/calendar/contexts/calendar-context";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon, Plus, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EventSuccessModal } from "./event-success-modal";

// Event colors for selection
const EVENT_COLORS = [
  { value: "blue", label: "Azul", color: "bg-blue-600" },
  { value: "green", label: "Verde", color: "bg-green-600" },
  { value: "red", label: "Vermelho", color: "bg-red-600" },
  { value: "yellow", label: "Amarelo", color: "bg-yellow-600" },
  { value: "purple", label: "Roxo", color: "bg-purple-600" },
  { value: "orange", label: "Laranja", color: "bg-orange-600" },
  { value: "gray", label: "Cinza", color: "bg-gray-600" },
] as const;

// Form validation schema
const createEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(255, "Título deve ter no máximo 255 caracteres"),
  description: z.string().min(1, "Descrição é obrigatória").max(1000, "Descrição deve ter no máximo 1000 caracteres"),
  startDate: z.date({ required_error: "Data de início é obrigatória" }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  endDate: z.date({ required_error: "Data de fim é obrigatória" }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)"),
  color: z.enum(["blue", "green", "red", "yellow", "purple", "orange", "gray"]).default("blue"),
  userId: z.string().uuid("Selecione um funcionário válido").nullable().optional(),
}).refine((data) => {
  const startDateTime = new Date(data.startDate);
  const [startHour, startMinute] = data.startTime.split(':').map(Number);
  startDateTime.setHours(startHour, startMinute, 0, 0);

  const endDateTime = new Date(data.endDate);
  const [endHour, endMinute] = data.endTime.split(':').map(Number);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  return endDateTime > startDateTime;
}, {
  message: "Data e hora de fim devem ser posteriores ao início",
  path: ["endTime"],
});

type CreateEventFormValues = z.infer<typeof createEventSchema>;

interface CreateEventDialogProps {
  children: React.ReactNode;
  defaultStartDate?: Date;
  defaultStartTime?: string;
}

export function CreateEventDialog({ 
  children, 
  defaultStartDate,
  defaultStartTime = "09:00"
}: CreateEventDialogProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { users } = useCalendar();
  
  // Dialog state management
  const [open, setOpen] = useState(false);

  // API mutation with automatic query invalidation
  const createMutation = api.event.create.useMutation({
    onSuccess: () => {
      queryClient.invalidate(["event.findMany"]);
    }
  });

  // Form setup with Zod validation
  const form = useFormWithZod({
    schema: createEventSchema,
    defaultValues: {
      title: "",
      description: "",
      startDate: defaultStartDate || new Date(),
      startTime: defaultStartTime,
      endDate: defaultStartDate || new Date(),
      endTime: "10:00",
      color: "blue" as const,
      userId: null,
    },
    onSubmit: async (values: CreateEventFormValues) => {
      try {
        // Combine date and time for start and end
        const startDateTime = new Date(values.startDate);
        const [startHour, startMinute] = values.startTime.split(':').map(Number);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(values.endDate);
        const [endHour, endMinute] = values.endTime.split(':').map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        const result = await tryCatch(
          createMutation.mutate({
            body: {
              title: values.title,
              description: values.description,
              startDate: startDateTime.toISOString(),
              endDate: endDateTime.toISOString(),
              color: values.color,
              userId: values.userId,
            },
          })
        );

        if (result.error) {
          toast.error("Erro ao criar evento. Tente novamente.");
          return;
        }

        // Success handling
        toast.success("Evento criado com sucesso!");
        
        // Show success modal if available
        if (typeof EventSuccessModal?.show === 'function') {
          EventSuccessModal.show({
            event: result.data.event,
            onClose: () => {
              // Close dialog and reset form
              setOpen(false);
              form.reset();
            }
          });
        } else {
          // Fallback: close dialog and reset form
          setOpen(false);
          form.reset();
        }

      } catch (error) {
        toast.error("Erro inesperado ao criar evento.");
        console.error("Event creation error:", error);
      }
    },
  });

  const isSubmitting = createMutation.loading;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div ref={triggerRef}>{children}</div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Novo Evento
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.onSubmit} className="space-y-6">
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Evento</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite o título do evento..."
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva os detalhes do evento..."
                      className="min-h-[80px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* User Selection */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Funcionário Responsável</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    value={field.value || "none"}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um funcionário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-xs">?</span>
                          </div>
                          Sem funcionário
                        </div>
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={user.picturePath || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="time"
                          {...field}
                          disabled={isSubmitting}
                          className="pl-10"
                        />
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Fim</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="time"
                          {...field}
                          disabled={isSubmitting}
                          className="pl-10"
                        />
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Color Selection */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor do Evento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma cor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${color.color}`} />
                            <span>{color.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Evento
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}