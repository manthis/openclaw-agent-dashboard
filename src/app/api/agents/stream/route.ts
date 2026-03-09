import { getAgentsGraph } from '@/lib/agents';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        try {
          const graph = getAgentsGraph();
          const data = JSON.stringify(graph);
          controller.enqueue(encoder.encode(`event: agents\ndata: ${data}\n\n`));
        } catch {
          // continue on error
        }
      };

      send();
      intervalId = setInterval(send, 3000);
    },
    cancel() {
      if (intervalId !== null) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
