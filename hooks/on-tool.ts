export async function beforeToolCall(toolName: string, args: any): Promise<boolean> {
  return true;
}

export async function afterToolCall(toolName: string, args: any, result: any): Promise<any> {
  return result;
}

export async function onToolError(toolName: string, args: any, error: any): Promise<string> {
  return `Error in ${toolName}: ${error.message}`;
}

export async function filterToolArgs(toolName: string, args: any): Promise<any> {
  return args;
}
