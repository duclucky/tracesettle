import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
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
});
