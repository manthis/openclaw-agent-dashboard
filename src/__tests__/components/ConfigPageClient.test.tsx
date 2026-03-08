import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { ConfigPageClient } from '@/components/config/ConfigPageClient';

// Mock all lucide-react icons
jest.mock('lucide-react', () => {
  const MockIcon = ({ className }: { className?: string }) => <span className={className} />;
  return {
    Save: MockIcon, Loader2: MockIcon, AlertCircle: MockIcon,
    FileText: MockIcon, Shield: MockIcon, Box: MockIcon, Cpu: MockIcon,
    Settings2: MockIcon, Wrench: MockIcon, Server: MockIcon,
    MessageSquare: MockIcon, Lock: MockIcon, Eye: MockIcon, EyeOff: MockIcon,
    Plus: MockIcon, X: MockIcon,
  };
});

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span>{children}</span>,
}));
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div>{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button role="tab" data-value={value}>{children}</button>,
  TabsContent: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}));
jest.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
  ),
}));
jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h3>{children}</h3>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

const mockConfig = {
  logging: { level: 'info' },
  gateway: { host: 'localhost', port: 18789 },
};

function mockFetch(response: object) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => response,
  });
}

describe('ConfigPageClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows loading spinner initially then renders config', async () => {
    mockFetch({ data: mockConfig });
    render(<ConfigPageClient />);
    await waitFor(() => {
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
  });

  it('shows error when fetch returns error', async () => {
    mockFetch({ error: 'File not found' });
    render(<ConfigPageClient />);
    await waitFor(() => {
      expect(screen.getByText('File not found')).toBeInTheDocument();
    });
  });

  it('shows error when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    render(<ConfigPageClient />);
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('Save Changes button is disabled when no changes', async () => {
    mockFetch({ data: mockConfig });
    render(<ConfigPageClient />);
    await waitFor(() => screen.getByText('Configuration'));
    const saveBtn = screen.getByText(/Save Changes/i).closest('button');
    expect(saveBtn).toBeDisabled();
  });
});

describe('ConfigPageClient - interactions', () => {
  const fullConfig = {
    logging: { level: 'info', file: 'app.log', consoleLevel: 'info', consoleStyle: 'pretty', redactSensitive: 'tools', redactPatterns: [] },
    auth: {},
    env: { vars: {}, shellEnv: { enabled: false, timeoutMs: 5000 } },
    models: { mode: 'auto', providers: {} },
    agents: { defaults: { workspace: '', repoRoot: '', model: '', secondaryModel: '', skipBootstrap: false, noCache: false, thinking: 'off', thinkingBudget: 0, maxTokens: 0, temperature: 0 } },
    tools: { allowedTools: [], deniedTools: [], confirmTools: [], allowShell: false, allowShellCommands: [] },
    gateway: { host: 'localhost', port: 18789, secret: '', https: false },
    channels: { telegram: { token: '', webhookUrl: '', allowedUsers: [] }, discord: { token: '', guildId: '' } },
    security: { allowedOrigins: [], trustedProxies: [], maxBodySize: '1mb' },
  };

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: fullConfig }),
    });
  });

  it('renders all sections (via flat tabs mock)', async () => {
    render(<ConfigPageClient />);
    await waitFor(() => screen.getByText('Configuration'));
    // Each section is a SectionCard with a title - rendered via CardTitle mock
    // The tab buttons also show these labels, so use getAllByText
    expect(screen.getAllByText('Logging').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gateway').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Security').length).toBeGreaterThan(0);
  });

  it('shows unsaved badge when text input changes', async () => {
    render(<ConfigPageClient />);
    await waitFor(() => screen.getByText('Configuration'));
    const textInputs = document.querySelectorAll('input[type="text"]');
    if (textInputs.length > 0) {
      await act(async () => {
        fireEvent.change(textInputs[0], { target: { value: 'changed_value_xyz' } });
      });
      expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();
    }
  });

  it('handles save success and shows success toast', async () => {
    render(<ConfigPageClient />);
    await waitFor(() => screen.getByText('Configuration'));
    const textInputs = document.querySelectorAll('input[type="text"]');
    if (textInputs.length > 0) {
      await act(async () => {
        fireEvent.change(textInputs[0], { target: { value: 'changed_xyz' } });
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      const saveBtn = screen.getByText(/Save Changes/i).closest('button');
      await act(async () => { fireEvent.click(saveBtn!); });
      await waitFor(() => {
        expect(screen.getByText(/Configuration saved/i)).toBeInTheDocument();
      });
    }
  });

  it('handles save error from server and shows error toast', async () => {
    render(<ConfigPageClient />);
    await waitFor(() => screen.getByText('Configuration'));
    const textInputs = document.querySelectorAll('input[type="text"]');
    if (textInputs.length > 0) {
      await act(async () => {
        fireEvent.change(textInputs[0], { target: { value: 'dirty_state' } });
      });
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Save failed' }),
      });
      const saveBtn = screen.getByText(/Save Changes/i).closest('button');
      await act(async () => { fireEvent.click(saveBtn!); });
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    }
  });

  it('handles save network error', async () => {
    render(<ConfigPageClient />);
    await waitFor(() => screen.getByText('Configuration'));
    const textInputs = document.querySelectorAll('input[type="text"]');
    if (textInputs.length > 0) {
      await act(async () => {
        fireEvent.change(textInputs[0], { target: { value: 'dirty2' } });
      });
      global.fetch = jest.fn().mockRejectedValue(new Error('Network down'));
      const saveBtn = screen.getByText(/Save Changes/i).closest('button');
      await act(async () => { fireEvent.click(saveBtn!); });
      await waitFor(() => {
        expect(screen.getByText('Network down')).toBeInTheDocument();
      });
    }
  });
});
