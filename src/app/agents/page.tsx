import { getAgents } from "@/lib/agents";
import { AgentsClient } from "@/components/AgentsClient";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await getAgents();
  return <AgentsClient initialAgents={agents} />;
}
