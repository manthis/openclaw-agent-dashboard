import { getLiveMetricsSampler } from '@/lib/metrics/liveMetricsSampler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const sampler = getLiveMetricsSampler();

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`retry: 3000\n\n`));
      controller.enqueue(encoder.encode(`: connected\n\n`));

      unsubscribe = sampler.subscribe((snap) => {
        try {
          controller.enqueue(encoder.encode(sseEvent('metrics', snap)));
        } catch {
          // stream closed
        }
      });

      // Ensure we have at least one sample ASAP.
      void sampler.sampleOnce();
    },
    cancel() {
      unsubscribe?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
