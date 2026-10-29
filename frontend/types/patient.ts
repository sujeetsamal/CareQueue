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
}

export interface RegisterPatientInput {
  name: string;
  department: string;
  age?: number | null;
  notes?: string | null;
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
