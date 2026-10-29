import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "../components/theme/ThemeToggle";
import { ThemeProvider } from "../components/theme/ThemeProvider";

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("renders theme toggle button with accessible label", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole("button", { name: /Theme selector/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("opens options dropdown and switches to dark mode", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole("button", { name: /Theme selector/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();

    const darkOption = screen.getByText("Dark");
    fireEvent.click(darkOption);

    expect(localStorage.getItem("carequeue-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("switches to light mode and updates localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByRole("button", { name: /Theme selector/i });
    fireEvent.click(toggleBtn);

    const lightOption = screen.getByText("Light");
    fireEvent.click(lightOption);

    expect(localStorage.getItem("carequeue-theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
