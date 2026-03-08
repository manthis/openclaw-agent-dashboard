import { getLiveMetricsSampler } from '@/lib/metrics/liveMetricsSampler';

export const runtime = 'nodejs';

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const sampler = getLiveMetricsSampler();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`retry: 5000\n`));
      controller.enqueue(encoder.encode(`: connected\n\n`));

      unsubscribe = sampler.subscribe((snap) => {
        controller.enqueue(encoder.encode(sseEvent('metrics', snap)));
      });

      // Ensure we have at least one sample ASAP (subscribe will emit last if present).
      void sampler.sampleOnce();
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
