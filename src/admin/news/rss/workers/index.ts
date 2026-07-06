// Client-side simulation status interface for server workers/schedulers

export interface WorkerStatus {
  lastExecution: string | null;
  isRunning: boolean;
  frequencyMinutes: number;
}

export function checkServerWorkerStatus(): WorkerStatus {
  // Queries active background processes from the modular server context
  return {
    lastExecution: new Date().toISOString(),
    isRunning: true,
    frequencyMinutes: 5
  };
}
