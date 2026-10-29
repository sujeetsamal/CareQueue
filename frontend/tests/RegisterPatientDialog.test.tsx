import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterPatientDialog } from "../components/patients/RegisterPatientDialog";
import { Patient, SimilarPatient } from "../types/patient";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getSimilarPatients: vi.fn(),
  },
}));

describe("RegisterPatientDialog Component", () => {
  const mockPatient: Patient = {
    id: "uuid-123",
    tokenNumber: "GEN-001",
    name: "Aarav Sharma",
    age: 28,
    department: "General Medicine",
    registrationTime: new Date().toISOString(),
    status: "WAITING",
    calledTime: null,
    completedTime: null,
    notes: "Fever and cough",
    queuePosition: 1,
    waitDurationSeconds: 0,
  };

  const mockSimilarPatients: SimilarPatient[] = [
    {
      id: "existing-1",
      name: "Aarav Sharma",
      tokenNumber: "GEN-002",
      department: "General Medicine",
      registrationTime: new Date().toISOString(),
      status: "WAITING",
      similarityScore: 1.0,
      isWaiting: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getSimilarPatients as any).mockResolvedValue([]);
  });

  it("renders form fields correctly when open", () => {
    render(
      <RegisterPatientDialog
        isOpen={true}
        onClose={vi.fn()}
        onPatientRegistered={vi.fn()}
        onSubmitApi={vi.fn()}
      />
    );

    expect(screen.getByText("Register New Patient")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Maya Lin/i)).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 35/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register & Enqueue/i })).toBeInTheDocument();
  });

  it("displays validation error when submitting with empty name", async () => {
    const mockSubmit = vi.fn();
    render(
      <RegisterPatientDialog
        isOpen={true}
        onClose={vi.fn()}
        onPatientRegistered={vi.fn()}
        onSubmitApi={mockSubmit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Register & Enqueue/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Patient name is required.")).toBeInTheDocument();
    });
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits valid patient data and displays assigned token on success", async () => {
    const mockSubmit = vi.fn().mockResolvedValue(mockPatient);
    const mockRegisteredCallback = vi.fn();

    render(
      <RegisterPatientDialog
        isOpen={true}
        onClose={vi.fn()}
        onPatientRegistered={mockRegisteredCallback}
        onSubmitApi={mockSubmit}
      />
    );

    const nameInput = screen.getByPlaceholderText(/e\.g\. Maya Lin/i);
    fireEvent.change(nameInput, { target: { value: "Aarav Sharma" } });

    const submitBtn = screen.getByRole("button", { name: /Register & Enqueue/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Aarav Sharma",
          department: "General Medicine",
        })
      );
      expect(screen.getByText("Registration Confirmed")).toBeInTheDocument();
      expect(screen.getByText("GEN-001")).toBeInTheDocument();
    });

    expect(mockRegisteredCallback).toHaveBeenCalledWith(mockPatient);
  });

  it("detects similar waiting patients and displays duplicate warning panel", async () => {
    (api.getSimilarPatients as any).mockResolvedValue(mockSimilarPatients);

    render(
      <RegisterPatientDialog
        isOpen={true}
        onClose={vi.fn()}
        onPatientRegistered={vi.fn()}
        onSubmitApi={vi.fn()}
      />
    );

    const nameInput = screen.getByPlaceholderText(/e\.g\. Maya Lin/i);
    fireEvent.change(nameInput, { target: { value: "Aarav Sharma" } });

    await waitFor(() => {
      expect(screen.getByText("Possible existing records")).toBeInTheDocument();
      expect(screen.getByText("Active Waiting Patient Match Detected")).toBeInTheDocument();
      expect(screen.getByText(/Confirm this is a different patient/i)).toBeInTheDocument();
    });
  });
});
