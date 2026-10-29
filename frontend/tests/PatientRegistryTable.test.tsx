import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PatientRegistryTable } from "../components/patients/PatientRegistryTable";
import { Patient } from "../types/patient";

describe("PatientRegistryTable Component", () => {
  const mockPatients: Patient[] = [
    {
      id: "p1",
      tokenNumber: "CQ-A101",
      name: "Maria Garcia",
      age: 34,
      department: "Cardiology",
      registrationTime: new Date().toISOString(),
      status: "WAITING",
      calledTime: null,
      completedTime: null,
      notes: "Routine",
      queuePosition: 1,
      waitDurationSeconds: 0,
    },
    {
      id: "p2",
      tokenNumber: "CQ-B202",
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
  ];

  it("renders all records and status counts correctly", () => {
    render(<PatientRegistryTable patients={mockPatients} />);

    expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("CQ-A101")).toBeInTheDocument();
    expect(screen.getByText("CQ-B202")).toBeInTheDocument();
  });

  it("filters records dynamically by search input", () => {
    render(<PatientRegistryTable patients={mockPatients} />);

    const searchInput = screen.getByPlaceholderText(/Search by patient name or token/i);
    fireEvent.change(searchInput, { target: { value: "maria" } });

    expect(screen.getByText("Maria Garcia")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  it("filters records by status tab selection", () => {
    render(<PatientRegistryTable patients={mockPatients} />);

    const completedTab = screen.getByRole("button", { name: /COMPLETED/i });
    fireEvent.click(completedTab);

    expect(screen.queryByText("Maria Garcia")).not.toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
