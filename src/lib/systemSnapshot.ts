import os from 'os';

export type SystemSnapshot = {
  cpu: { percent: number; loadAvg: string };
  memory: { used: number; total: number; percent: number };
};

export function getSystemSnapshot(): SystemSnapshot {
  const loadAvg = os.loadavg()[0];
  const cpuCores = os.cpus().length;
  const cpuPercent = Math.min(100, Math.round((loadAvg / cpuCores) * 100));

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  return {
    cpu: { percent: cpuPercent, loadAvg: loadAvg.toFixed(2) },
    memory: {
      used: usedMem,
      total: totalMem,
      percent: Math.round((usedMem / totalMem) * 100),
    },
  };
}
