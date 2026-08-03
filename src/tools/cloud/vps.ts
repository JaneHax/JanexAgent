import { terminalTool } from '../terminal/exec.js';
import axios from 'axios';

export class VPSTool {
  async ssh(command: string, host: string, user = 'root', keyPath?: string): Promise<string> {
    const sshCmd = keyPath
      ? `ssh -i ${keyPath} ${user}@${host} "${command.replace(/"/g, '\\"')}"`
      : `ssh ${user}@${host} "${command.replace(/"/g, '\\"')}"`;

    return await terminalTool.execute(sshCmd);
  }

  async scpUpload(localPath: string, remotePath: string, host: string, user = 'root', keyPath?: string): Promise<string> {
    const scpCmd = keyPath
      ? `scp -i ${keyPath} ${localPath} ${user}@${host}:${remotePath}`
      : `scp ${localPath} ${user}@${host}:${remotePath}`;

    return await terminalTool.execute(scpCmd);
  }

  async scpDownload(remotePath: string, localPath: string, host: string, user = 'root', keyPath?: string): Promise<string> {
    const scpCmd = keyPath
      ? `scp -i ${keyPath} ${user}@${host}:${remotePath} ${localPath}`
      : `scp ${user}@${host}:${remotePath} ${localPath}`;

    return await terminalTool.execute(scpCmd);
  }

  async checkConnectivity(host: string, port = 22): Promise<string> {
    try {
      const result = await terminalTool.execute(`nc -zv -w 5 ${host} ${port}`);
      return result.includes('succeeded') || result.includes('open') ? `Host ${host}:${port} reachable` : `Host ${host}:${port} unreachable`;
    } catch {
      return `Host ${host}:${port} unreachable`;
    }
  }

  async publicIP(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
      return `Public IP: ${response.data.ip}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export const vpsTool = new VPSTool();
