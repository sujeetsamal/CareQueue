import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterPatientDialog } from "../components/patients/RegisterPatientDialog";
import { Patient } from "../types/patient";

describe("RegisterPatientDialog Component", () => {
  const mockPatient: Patient = {
    id: "uuid-123",
    tokenNumber: "GEN-101",
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
      expect(screen.getByText("GEN-101")).toBeInTheDocument();
    });

    expect(mockRegisteredCallback).toHaveBeenCalledWith(mockPatient);
  });
});
