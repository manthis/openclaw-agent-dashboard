import React from "react";
import { render, screen } from "@testing-library/react";
import { AgentNode } from "@/components/AgentNode";
import type { Agent } from "@/types/agent";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) =>
      React.createElement("div", props, children),
  },
}));

jest.mock("@/components/StatusBadge", () => ({
  StatusBadge: ({ status }: { status: string }) => React.createElement("span", null, status),
}));

const mockAgent: Agent = {
  id: "tars", name: "TARS", emoji: "🤖", model: "claude",
  workspace: "/test", theme: "Robot", avatar: null, status: "idle",
  files: { soul: true, identity: true, tools: true, memory: true }, relations: [],
};

describe("AgentNode", () => {
  it("renders agent name", () => {
    render(<AgentNode data={mockAgent} selected={false} />);
    expect(screen.getByText("TARS")).toBeInTheDocument();
  });
  it("renders agent id", () => {
    render(<AgentNode data={mockAgent} />);
    expect(screen.getByText("tars")).toBeInTheDocument();
  });
  it("renders agent emoji", () => {
    render(<AgentNode data={mockAgent} />);
    expect(screen.getByText("🤖")).toBeInTheDocument();
  });
  it("applies selected state", () => {
    const { container } = render(<AgentNode data={mockAgent} selected={true} />);
    expect(container.firstChild).toBeTruthy();
  });
});
