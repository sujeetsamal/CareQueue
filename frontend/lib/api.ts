import {
  Patient,
  QueueStats,
  RegisterPatientInput,
  PatientStatus,
  ApiError,
  SimilarPatient,
  PagedResponse,
  RegistryFilterParams,
} from "@/types/patient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

export class ApiClientError extends Error {
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(message: string, code: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorData: ApiError | null = null;
      try {
        errorData = await response.json();
      } catch {
        // Fallback for non-JSON responses
      }

      const message = errorData?.message || `HTTP ${response.status}: ${response.statusText}`;
      const code = errorData?.code || `HTTP_${response.status}`;
      throw new ApiClientError(message, code, errorData?.fieldErrors);
    }

    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    // Network errors, connection refused, CORS errors
    const netErr = error as Error;
    throw new ApiClientError(
      netErr.message || "Failed to connect to CareQueue backend service.",
      "NETWORK_ERROR"
    );
  }
}

export const api = {
  checkHealth: async (): Promise<{ status: string; waitingCount: number }> => {
    return request("/health");
  },

  getDashboardStats: async (): Promise<QueueStats> => {
    return request("/dashboard/stats");
  },

  getWaitingQueue: async (): Promise<Patient[]> => {
    return request("/queue/waiting");
  },

  callNextPatient: async (): Promise<Patient> => {
    return request("/queue/call-next", { method: "POST" });
  },

  getRecentCalls: async (): Promise<Patient[]> => {
    return request("/queue/recent-calls");
  },

  repeatLastCall: async (): Promise<Patient> => {
    return request("/queue/repeat-last-call", { method: "POST" });
  },

  registerPatient: async (data: RegisterPatientInput): Promise<Patient> => {
    return request("/patients", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getSimilarPatients: async (
    name: string,
    department?: string,
    age?: number | null
  ): Promise<SimilarPatient[]> => {
    const query = new URLSearchParams();
    query.append("name", name);
    if (department && department !== "ALL") query.append("department", department);
    if (age !== undefined && age !== null && !isNaN(age)) query.append("age", String(age));

    return request(`/patients/similar?${query.toString()}`);
  },

  getPatientsPaged: async (params: RegistryFilterParams = {}): Promise<PagedResponse<Patient>> => {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append("page", String(params.page));
    if (params.size !== undefined) query.append("size", String(params.size));
    if (params.search) query.append("search", params.search);
    if (params.department && params.department !== "ALL") query.append("department", params.department);
    if (params.status && params.status !== "ALL") query.append("status", params.status);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.startDate) query.append("startDate", params.startDate);
    if (params.endDate) query.append("endDate", params.endDate);

    const qs = query.toString();
    return request(qs ? `/patients/paged?${qs}` : "/patients/paged");
  },

  getPatients: async (params?: {
    search?: string;
    department?: string;
    status?: PatientStatus;
  }): Promise<Patient[]> => {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.department) query.append("department", params.department);
    if (params?.status) query.append("status", params.status);

    const queryString = query.toString();
    const endpoint = queryString ? `/patients?${queryString}` : "/patients";
    return request(endpoint);
  },

  getPatientById: async (id: string): Promise<Patient> => {
    return request(`/patients/${id}`);
  },

  cancelWaitingPatient: async (id: string): Promise<Patient> => {
    return request(`/patients/${id}`, { method: "DELETE" });
  },

  completePatient: async (id: string): Promise<Patient> => {
    return request(`/patients/${id}/complete`, { method: "PATCH" });
  },
};
