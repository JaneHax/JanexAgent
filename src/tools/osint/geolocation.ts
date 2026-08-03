import axios from 'axios';

export class GeolocationTool {
  async ipLookup(ip: string): Promise<string> {
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 10000 });
      const data = response.data;

      if (data.status === 'fail') {
        return `IP lookup failed: ${data.message}`;
      }

      return JSON.stringify({
        ip: data.query,
        country: data.country,
        region: data.regionName,
        city: data.city,
        zip: data.zip,
        lat: data.lat,
        lon: data.lon,
        isp: data.isp,
        org: data.org,
        as: data.as,
        timezone: data.timezone
      }, null, 2);
    } catch (error: any) {
      return `IP lookup error: ${error.message}`;
    }
  }

  async myIp(): Promise<string> {
    try {
      const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
      const ip = response.data.ip;
      return this.ipLookup(ip);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
}

export const geolocationTool = new GeolocationTool();
