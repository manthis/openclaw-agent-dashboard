import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgentNode } from "@/components/AgentNode";
import type { Agent } from "@/types/agent";

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement("div", props, children),
  },
}));

jest.mock("@/components/StatusBadge", () => ({
  StatusBadge: ({ status }: { status: string }) => React.createElement("span", null, status),
}));

const mockAgent: Agent = {
  id: "tars", name: "TARS", emoji: "\uD83E\uDD16", model: "claude",
  workspace: "/test", theme: "Robot", avatar: null, status: "idle",
  files: { soul: true, identity: true, tools: true, memory: true, user: false, agents: false, heartbeat: false },
  relations: [],
};

describe("AgentNode", () => {
  it("renders agent name", () => {
    render(<AgentNode data={mockAgent} selected={false} />);
    expect(screen.getByText("TARS")).toBeInTheDocument();
  });
  it("renders agent emoji when no avatar", () => {
    render(<AgentNode data={mockAgent} />);
    expect(screen.getByText("\uD83E\uDD16")).toBeInTheDocument();
  });
  it("renders status badge", () => {
    render(<AgentNode data={mockAgent} />);
    expect(screen.getByText("idle")).toBeInTheDocument();
  });
  it("renders img when avatar is set", () => {
    const withAvatar = { ...mockAgent, avatar: "hal9000.png" };
    render(<AgentNode data={withAvatar} />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
  });
  it("applies selected state without crash", () => {
    const { container } = render(<AgentNode data={mockAgent} selected={true} />);
    expect(container.firstChild).toBeTruthy();
  });
  it("falls back to emoji when avatar image errors", () => {
    const withAvatar = { ...mockAgent, avatar: "bad.png" };
    render(<AgentNode data={withAvatar} />);
    const img = document.querySelector("img");
    expect(img).toBeTruthy();
    // Trigger onError to cover the imgError handler
    fireEvent.error(img!);
    // After error, emoji should appear
    expect(screen.getByText("\uD83E\uDD16")).toBeInTheDocument();
  });
});
