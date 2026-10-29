import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WaitingQueueTable } from "../components/dashboard/WaitingQueueTable";
import { Patient } from "../types/patient";

describe("WaitingQueueTable Component", () => {
  const mockQueue: Patient[] = [
    {
      id: "p1",
      tokenNumber: "CQ-101",
      name: "Alice Smith",
      age: 30,
      department: "Cardiology",
      registrationTime: new Date(Date.now() - 600000).toISOString(),
      status: "WAITING",
      calledTime: null,
      completedTime: null,
      notes: null,
      queuePosition: 1,
      waitDurationSeconds: 600,
    },
    {
      id: "p2",
      tokenNumber: "CQ-102",
      name: "Bob Jones",
      age: 45,
      department: "Emergency",
      registrationTime: new Date(Date.now() - 300000).toISOString(),
      status: "WAITING",
      calledTime: null,
      completedTime: null,
      notes: null,
      queuePosition: 2,
      waitDurationSeconds: 300,
    },
  ];

  it("renders empty state when queue is empty", () => {
    render(
      <WaitingQueueTable
        queue={[]}
        onCallNext={vi.fn()}
        onCancelPatient={vi.fn()}
      />
    );

    expect(screen.getByText("No Patients Waiting")).toBeInTheDocument();
  });

  it("renders waiting patients in FIFO order and highlights #1 next", () => {
    render(
      <WaitingQueueTable
        queue={mockQueue}
        onCallNext={vi.fn()}
        onCancelPatient={vi.fn()}
      />
    );

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    expect(screen.getByText(/#1 Next/i)).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
  });

  it("calls onCallNext when Call Next button is clicked", () => {
    const mockCallNext = vi.fn();
    render(
      <WaitingQueueTable
        queue={mockQueue}
        onCallNext={mockCallNext}
        onCancelPatient={vi.fn()}
      />
    );

    const callNextButtons = screen.getAllByRole("button", { name: /Call/i });
    fireEvent.click(callNextButtons[0]);

    expect(mockCallNext).toHaveBeenCalledTimes(1);
  });

  it("calls onCancelPatient when cancel icon is clicked", () => {
    const mockCancel = vi.fn();
    render(
      <WaitingQueueTable
        queue={mockQueue}
        onCallNext={vi.fn()}
        onCancelPatient={mockCancel}
      />
    );

    const cancelButtons = screen.getAllByTitle("Cancel waiting entry");
    fireEvent.click(cancelButtons[0]);

    expect(mockCancel).toHaveBeenCalledWith(mockQueue[0]);
  });
});
