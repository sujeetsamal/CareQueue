import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PatientRegistryTable } from "../components/patients/PatientRegistryTable";
import { api } from "@/lib/api";
import { PagedResponse, Patient } from "../types/patient";

vi.mock("@/lib/api", () => ({
  api: {
    getPatientsPaged: vi.fn(),
  },
}));

describe("PatientRegistryTable Component", () => {
  const mockPage: PagedResponse<Patient> = {
    content: [
      {
        id: "p1",
        tokenNumber: "CRD-001",
        name: "Maria Garcia",
        age: 34,
        department: "Cardiology",
        registrationTime: new Date().toISOString(),
        status: "WAITING",
        calledTime: null,
        completedTime: null,
        notes: "Chest pain",
        queuePosition: 1,
        waitDurationSeconds: 0,
      },
      {
        id: "p2",
        tokenNumber: "ORT-001",
        name: "John Doe",
        age: 60,
        department: "Orthopedics",
        registrationTime: new Date().toISOString(),
        status: "COMPLETED",
        calledTime: new Date().toISOString(),
        completedTime: new Date().toISOString(),
        notes: "Follow-up",
        queuePosition: null,
        waitDurationSeconds: 120,
      },
    ],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 2,
    totalPages: 1,
    isFirst: true,
    isLast: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.getPatientsPaged as any).mockResolvedValue(mockPage);
  });

  it("renders records and server pagination metadata correctly", async () => {
    render(<PatientRegistryTable />);

    await waitFor(
      () => {
        expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("CRD-001")).toBeInTheDocument();
        expect(screen.getByText("ORT-001")).toBeInTheDocument();
        expect(screen.getByText(/Page 1 of 1/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });

  it("triggers search and resets page when search input changes", async () => {
    render(<PatientRegistryTable />);

    const searchInput = screen.getByPlaceholderText(/Search by name, token/i);
    fireEvent.change(searchInput, { target: { value: "maria" } });

    await waitFor(
      () => {
        expect(api.getPatientsPaged).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "maria",
            page: 0,
          })
        );
      },
      { timeout: 4000 }
    );
  });

  it("filters by status tab selection", async () => {
    render(<PatientRegistryTable />);

    const completedTab = screen.getByRole("button", { name: "COMPLETED" });
    fireEvent.click(completedTab);

    await waitFor(
      () => {
        expect(api.getPatientsPaged).toHaveBeenCalledWith(
          expect.objectContaining({
            status: "COMPLETED",
            page: 0,
          })
        );
      },
      { timeout: 4000 }
    );
  });

  it("opens patient details modal when Details button is clicked", async () => {
    render(<PatientRegistryTable />);

    await waitFor(
      () => {
        expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    const detailsButtons = screen.getAllByRole("button", { name: /Details/i });
    fireEvent.click(detailsButtons[0]);

    await waitFor(
      () => {
        expect(screen.getByText("Patient Record Details")).toBeInTheDocument();
        expect(screen.getByText("Chest pain")).toBeInTheDocument();
      },
      { timeout: 4000 }
    );
  });
});
