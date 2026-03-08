import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

jest.mock("lucide-react", () => ({
  LayoutDashboard: () => React.createElement("span", null, "icon-dashboard"),
  Network: () => React.createElement("span", null, "icon-network"),
  Users: () => React.createElement("span", null, "icon-users"),
  Bot: () => React.createElement("span", null, "icon-bot"),
  Settings: () => React.createElement("span", null, "icon-settings"),
}));

import { Sidebar } from "@/components/Sidebar";

describe("Sidebar", () => {
  it("renders Dashboard link", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
  it("renders Agents Map link", () => {
    render(<Sidebar />);
    expect(screen.getByText("Agents Map")).toBeInTheDocument();
  });
  it("renders Agents link", () => {
    render(<Sidebar />);
    expect(screen.getByText("Agents")).toBeInTheDocument();
  });
  it("renders Config link", () => {
    render(<Sidebar />);
    expect(screen.getByText("Config")).toBeInTheDocument();
  });
  it("renders brand name", () => {
    render(<Sidebar />);
    expect(screen.getByText("OpenClaw")).toBeInTheDocument();
  });
  it("highlights active Dashboard link", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });
});
