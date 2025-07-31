import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders Meeting Audio Studio", () => {
    render(<App />);
    // Check for the main heading in the hero section
    const titleElement = screen.getByRole("heading", {
      name: /Transform your meeting recordings with AI precision/i,
    });
    expect(titleElement).toBeInTheDocument();

    // Check for the header title
    const headerTitle = screen.getByRole("heading", {
      name: /Meeting Audio Studio/i,
      level: 1,
    });
    expect(headerTitle).toBeInTheDocument();
  });
});
