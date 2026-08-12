import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./App";

const routeHeadings = [
  ["/", "Settle the failed workflow"],
  ["/workflows", "Workflow inbox"],
  ["/workflows/new", "Create workflow"],
  ["/workflows/trace-1001", "Workflow room"],
  ["/workflows/trace-1001/evidence/step-build", "Submit evidence"],
  ["/credits", "Credits"],
  ["/settings", "Wallet and network"],
  ["/help", "Verification guide"]
] as const;

describe("TraceSettle route map", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CONTRACT_ADDRESS", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(routeHeadings)("renders %s as %s", (route, heading) => {
    render(
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", {
        name: heading
      })
    ).toBeInTheDocument();
  });

  it("keeps persistent navigation visible on task routes", () => {
    render(
      <MemoryRouter initialEntries={["/workflows/trace-1001"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workflows" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Credits" })).toBeInTheDocument();
  });

  it("does not present the fixture wallet as a real connected account", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.queryByText("0x742d...f44e")).not.toBeInTheDocument();
    expect(screen.getByText("Missing VITE_CONTRACT_ADDRESS")).toBeInTheDocument();
    expect(screen.getByText("No browser wallet detected")).toBeInTheDocument();
  });

  it("blocks live actions honestly until a contract address is configured", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/workflows/new"]}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Submit workflow transaction" }));

    expect(
      screen.getByText("Missing VITE_CONTRACT_ADDRESS. Configure a deployed contract before signing.")
    ).toBeInTheDocument();
  });
});
