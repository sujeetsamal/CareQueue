export type PatientStatus = "WAITING" | "CALLED" | "COMPLETED" | "CANCELLED";

export interface Patient {
  id: string;
  tokenNumber: string;
  name: string;
  age: number | null;
  department: string;
  registrationTime: string;
  status: PatientStatus;
  calledTime: string | null;
  completedTime: string | null;
  notes: string | null;
  queuePosition: number | null;
  waitDurationSeconds: number | null;
  queueDate?: string | null;
  departmentCode?: string | null;
  sequenceNumber?: number | null;
}

export interface RegisterPatientInput {
  name: string;
  department: string;
  age?: number | null;
  notes?: string | null;
}

export interface SimilarPatient {
  id: string;
  name: string;
  tokenNumber: string;
  department: string;
  registrationTime: string;
  status: PatientStatus;
  similarityScore: number;
  isWaiting: boolean;
}

export interface PagedResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface RegistryFilterParams {
  page?: number;
  size?: number;
  search?: string;
  department?: string;
  status?: PatientStatus | "ALL";
  sortBy?: string;
  startDate?: string;
  endDate?: string;
}

export interface QueueStats {
  waitingCount: number;
  calledTodayCount: number;
  completedTodayCount: number;
  averageWaitTimeMinutes: number | null;
}

export interface ApiError {
  message: string;
  code: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
}
