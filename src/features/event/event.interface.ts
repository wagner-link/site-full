import type { User } from "../user/user.interface";

/**
 * Event color enum matching Prisma schema
 */
export type EventColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"
  | "gray";

/**
 * Represents a Event entity.
 */
export interface Event {
  /** Id's id property */
  id: string;
  /** Title's title property */
  title: string;
  /** Description's description property */
  description: string;
  /** StartDate's startDate property */
  startDate: string;
  /** EndDate's endDate property */
  endDate: string;
  /** Color's color property */
  color: EventColor;
  /** UserId's userId property (opcional - evento pode existir sem usuário) */
  userId?: string | null;
  /** Related User entity */
  user?: User | null;
  /** CreatedAt's createdAt property */
  createdAt: Date;
  /** UpdatedAt's updatedAt property */
  updatedAt: Date;
}

/**
 * Data transfer object for creating a new Event.
 */
export interface CreateEventDTO {
  /** Title's title property  */
  title: string;
  /** Description's description property  */
  description: string;
  /** StartDate's startDate property  */
  startDate: string;
  /** EndDate's endDate property  */
  endDate: string;
  /** Color's color property  */
  color: EventColor;
  /** UserId's userId property (opcional)  */
  userId?: string | null;
}

/**
 * Data transfer object for updating an existing Event.
 */
export interface UpdateEventDTO {
  /** Title's title property  */
  title?: string;
  /** Description's description property  */
  description?: string;
  /** StartDate's startDate property  */
  startDate?: string;
  /** EndDate's endDate property  */
  endDate?: string;
  /** Color's color property  */
  color?: EventColor;
  /** UserId's userId property (opcional)  */
  userId?: string | null;
}

/**
 * Query parameters for fetching Event entities
 */
export interface EventQueryParams {
  /** Current page number for pagination */
  page?: number;
  /** Number of items to return per page */
  limit?: number;
  /** Property to sort by */
  sortBy?: string;
  /** Sort order */
  sortOrder?: "asc" | "desc";
  /** Search term for filtering */
  search?: string;
}

/**
 * Response interface for successful event creation
 */
export interface CreateEventResponse {
  /** Created event data */
  event: Event;
  /** Success message */
  message: string;
  /** HTTP status code */
  status: number;
}

/**
 * Validation error interface
 */
export interface EventValidationError {
  /** Field name that failed validation */
  field: string;
  /** Error message */
  message: string;
  /** Received value */
  value?: any;
}