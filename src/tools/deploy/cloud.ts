import Docker from 'dockerode';
import { terminalTool } from '../terminal/exec.js';

export class CloudDeployTool {
  async deployDocker(options: {
    image: string;
    containerName: string;
    ports?: string[];
    env?: Record<string, string>;
    volumes?: string[];
  }): Promise<string> {
    try {
      const docker = new Docker();
      const envArray = options.env ? Object.entries(options.env).map(([k, v]) => `${k}=${v}`) : [];
      const portBindings: any = {};

      if (options.ports) {
        for (const port of options.ports) {
          const [hostPort, containerPort] = port.split(':');
          portBindings[containerPort || hostPort] = [{ HostPort: hostPort, HostIP: '0.0.0.0' }];
        }
      }

      const container = await docker.createContainer({
        Image: options.image,
        name: options.containerName,
        Env: envArray,
        HostConfig: {
          PortBindings: portBindings,
          ...(options.volumes ? { Binds: options.volumes } : {})
        }
      });

      await container.start();
      return `Container ${options.containerName} started`;
    } catch (error: any) {
      return `Docker error: ${error.message}`;
    }
  }

  async dockerCompose(action: 'up' | 'down' | 'ps' | 'logs', composeFile = 'docker-compose.yml'): Promise<string> {
    const commands: Record<string, string> = {
      up: `docker-compose -f ${composeFile} up -d`,
      down: `docker-compose -f ${composeFile} down`,
      ps: `docker-compose -f ${composeFile} ps`,
      logs: `docker-compose -f ${composeFile} logs --tail=50`
    };

    return await terminalTool.execute(commands[action]);
  }

  async dockerLogs(containerName: string, tail = 100): Promise<string> {
    const result = await terminalTool.execute(`docker logs ${containerName} --tail=${tail}`);
    return result;
  }

  async deployVercel(dir = '.'): Promise<string> {
    try {
      const result = await terminalTool.execute(`vercel --yes --cwd ${dir}`);
      return `Vercel deploy: ${result}`;
    } catch (error: any) {
      return `Vercel error: ${error.message}`;
    }
  }

  async deployCloudflare(dir = '.'): Promise<string> {
    try {
      const result = await terminalTool.execute(`npx wrangler pages publish . --project-name janex-site --cwd ${dir}`);
      return `Cloudflare Pages deploy: ${result}`;
    } catch (error: any) {
      return `Cloudflare error: ${error.message}`;
    }
  }
}

export const cloudDeployTool = new CloudDeployTool();
