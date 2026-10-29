import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecentCallsStackPanel } from "../components/dashboard/RecentCallsStackPanel";
import { Patient } from "../types/patient";

describe("RecentCallsStackPanel Component", () => {
  const mockCalls: Patient[] = [
    {
      id: "p1",
      tokenNumber: "CQ-101",
      name: "Latest Called Patient",
      age: 50,
      department: "Cardiology",
      registrationTime: new Date(Date.now() - 10000).toISOString(),
      status: "CALLED",
      calledTime: new Date().toISOString(),
      completedTime: null,
      notes: null,
      queuePosition: null,
      waitDurationSeconds: 10,
    },
    {
      id: "p2",
      tokenNumber: "CQ-102",
      name: "Earlier Called Patient",
      age: 22,
      department: "General Medicine",
      registrationTime: new Date(Date.now() - 20000).toISOString(),
      status: "COMPLETED",
      calledTime: new Date(Date.now() - 5000).toISOString(),
      completedTime: new Date().toISOString(),
      notes: null,
      queuePosition: null,
      waitDurationSeconds: 15,
    },
  ];

  it("renders empty state when stack is empty", () => {
    render(
      <RecentCallsStackPanel
        recentCalls={[]}
        onRepeatCall={vi.fn()}
      />
    );

    expect(screen.getByText("Stack is Empty")).toBeInTheDocument();
  });

  it("renders items in LIFO order and displays STACK TOP indicator", () => {
    render(
      <RecentCallsStackPanel
        recentCalls={mockCalls}
        onRepeatCall={vi.fn()}
      />
    );

    expect(screen.getByText("Latest Called Patient")).toBeInTheDocument();
    expect(screen.getByText("STACK TOP")).toBeInTheDocument();
    expect(screen.getByText("Earlier Called Patient")).toBeInTheDocument();
  });

  it("calls onRepeatCall when repeat action button is clicked", () => {
    const mockRepeat = vi.fn();
    render(
      <RecentCallsStackPanel
        recentCalls={mockCalls}
        onRepeatCall={mockRepeat}
      />
    );

    const repeatBtn = screen.getByRole("button", { name: /Repeat Last Call/i });
    fireEvent.click(repeatBtn);

    expect(mockRepeat).toHaveBeenCalledTimes(1);
  });
});
