export async function onTaskStart(task: any): Promise<void> {
  console.log(`[hook] Task started: ${task.id}`);
}

export async function onTaskComplete(task: any, result: any): Promise<void> {
  console.log(`[hook] Task completed: ${task.id}`);
}

export async function onTaskError(task: any, error: any): Promise<void> {
  console.error(`[hook] Task error: ${task.id}`, error);
}

export async function onToolUse(toolName: string, args: any): Promise<void> {
  console.log(`[hook] Tool used: ${toolName}`);
}

export async function onProviderCall(provider: string, model: string): Promise<void> {
  console.log(`[hook] Provider call: ${provider}/${model}`);
}
