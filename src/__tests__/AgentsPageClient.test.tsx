import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AgentsPageClient } from "@/components/AgentsPageClient";
import type { Agent } from "@/types/agent";

jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: (props: any) =>
    React.createElement("img", { src: props.src, alt: props.alt, onError: props.onError }),
}));

jest.mock("@/components/StatusBadge", () => ({
  StatusBadge: ({ status }: { status: string }) =>
    React.createElement("span", { "data-testid": "status-badge" }, status),
}));

const mockAgents: Agent[] = [
  {
    id: "hal9000", name: "HAL9000", emoji: "\uD83D\uDD34", model: "claude-sonnet",
    workspace: "/ws/hal", theme: "Space", avatar: null, status: "active",
    files: { soul: true, identity: true, tools: true, memory: false, user: true, agents: true, heartbeat: false },
    relations: ["mother"],
  },
  {
    id: "tars", name: "TARS", emoji: "\uD83E\uDD16", model: "claude-code",
    workspace: "/ws/tars", theme: "Robot", avatar: "tars.png", status: "idle",
    files: { soul: true, identity: true, tools: false, memory: false, user: false, agents: false, heartbeat: false },
    relations: [],
  },
];

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock window.confirm to return true by default
beforeAll(() => {
  window.confirm = jest.fn(() => true);
});

beforeEach(() => { mockFetch.mockReset(); });

function jsonResponse(data: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(data) } as Response);
}

describe("AgentsPageClient", () => {
  it("shows loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<AgentsPageClient />);
    expect(screen.getByText("Loading agents...")).toBeInTheDocument();
  });

  it("renders agent list after fetch", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    render(<AgentsPageClient />);
    await waitFor(() => expect(screen.getByText("HAL9000")).toBeInTheDocument());
    expect(screen.getByText("TARS")).toBeInTheDocument();
  });

  it("shows agent count", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    render(<AgentsPageClient />);
    await waitFor(() => expect(screen.getByText("2 agents configured")).toBeInTheDocument());
  });

  it("shows empty state when no agents", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse([]));
    render(<AgentsPageClient />);
    await waitFor(() => expect(screen.getByText("No agents found.")).toBeInTheDocument());
  });

  it("opens edit panel on agent click", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "# SOUL" }));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => expect(screen.getByText("Identity")).toBeInTheDocument());
  });

  it("shows Add Agent button as disabled", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    const addBtn = screen.getByTitle("POST /api/agents not yet available");
    expect(addBtn).toBeDisabled();
  });

  it("saves agent on form submit", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    mockFetch.mockReturnValueOnce(jsonResponse({ ...mockAgents[0], name: "HAL-NEW" }));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Identity"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      "/api/agents/hal9000",
      expect.objectContaining({ method: "PUT" })
    ));
  });

  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    render(<AgentsPageClient />);
    await waitFor(() => expect(screen.queryByText("Loading agents...")).not.toBeInTheDocument());
  });

  it("deletes agent when delete button is clicked", async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" })); // file load
    mockFetch.mockReturnValueOnce(jsonResponse({}, true)); // DELETE
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      "/api/agents/hal9000",
      expect.objectContaining({ method: "DELETE" })
    ));
  });

  it("saves file content", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "# SOUL content" })); // file load
    mockFetch.mockReturnValueOnce(jsonResponse({ ok: true })); // file save
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Save SOUL.md"));
    fireEvent.click(screen.getByText("Save SOUL.md"));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/agents/hal9000/files/"),
      expect.objectContaining({ method: "PUT" })
    ));
  });

  it("switches file tabs", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "# SOUL" }));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "# IDENTITY" }));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    // File tabs render as "IDENTITY.md" (split text nodes) — use regex
    await waitFor(() => screen.getByRole('button', { name: /^IDENTITY\.md$/ }));
    fireEvent.click(screen.getByRole('button', { name: /^IDENTITY\.md$/ }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("identity")
    ));
  });

  it("shows avatar image when agent has avatar", async () => {
    const agentsWithAvatar = [{ ...mockAgents[0], avatar: "hal9000.png" }];
    mockFetch.mockReturnValueOnce(jsonResponse(agentsWithAvatar));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    // Avatar renders in the list
    expect(document.querySelector('img')).toBeTruthy();
  });

  it("shows error toast when save fails", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    mockFetch.mockReturnValueOnce(jsonResponse(null, false));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Identity"));
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(screen.getByText("Error saving agent")).toBeInTheDocument());
  });

  it("shows error toast when delete fails", async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    mockFetch.mockReturnValueOnce(jsonResponse(null, false));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(screen.getByText("Error deleting agent")).toBeInTheDocument());
  });

  it("aborts delete when confirm is cancelled", async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    const deleteCalls = mockFetch.mock.calls.filter(
      (c) => typeof c[1] === "object" && c[1] !== null && "method" in c[1] && (c[1] as RequestInit).method === "DELETE"
    );
    expect(deleteCalls).toHaveLength(0);
  });

  it("shows error toast when file save fails", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    mockFetch.mockReturnValueOnce(jsonResponse(null, false));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Save SOUL.md"));
    fireEvent.click(screen.getByText("Save SOUL.md"));
    await waitFor(() => expect(screen.getByText("Error saving file")).toBeInTheDocument());
  });

  it("renders AgentAvatar with image when agent has avatar", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("TARS"));
    const imgs = document.querySelectorAll("img");
    const avatarImg = Array.from(imgs).find((img) => img.getAttribute("src")?.includes("/api/agents/tars/avatar"));
    expect(avatarImg).toBeTruthy();
  });

  it("AgentAvatar falls back to emoji on image error", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("TARS"));
    const imgs = document.querySelectorAll("img");
    const avatarImg = Array.from(imgs).find((img) => img.getAttribute("src")?.includes("/api/agents/tars/avatar"));
    expect(avatarImg).toBeTruthy();
    fireEvent.error(avatarImg!);
    await waitFor(() => {
      const emojis = screen.getAllByText("\uD83E\uDD16");
      expect(emojis.length).toBeGreaterThan(0);
    });
  });

  it("closes edit panel on close button", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Identity"));
    fireEvent.click(screen.getByLabelText("Close"));
    await waitFor(() => expect(screen.queryByText("Identity")).not.toBeInTheDocument());
  });

  it("updates form fields", async () => {
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Identity"));
    const nameInput = screen.getByDisplayValue("HAL9000");
    fireEvent.change(nameInput, { target: { value: "HAL-UPDATED" } });
    expect(screen.getByDisplayValue("HAL-UPDATED")).toBeInTheDocument();
  });

  it("delete success removes agent from list", async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);
    mockFetch.mockReturnValueOnce(jsonResponse(mockAgents));
    mockFetch.mockReturnValueOnce(jsonResponse({ content: "" }));
    mockFetch.mockReturnValueOnce(jsonResponse(null, true));
    render(<AgentsPageClient />);
    await waitFor(() => screen.getByText("HAL9000"));
    fireEvent.click(screen.getByText("HAL9000"));
    await waitFor(() => screen.getByText("Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(screen.queryByText("Identity")).not.toBeInTheDocument());
    // Agent count should update
    await waitFor(() => expect(screen.getByText("1 agent configured")).toBeInTheDocument());
  });
});
