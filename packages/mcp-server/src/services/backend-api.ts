export class BackendApi {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
  }

  async post(path: string, body: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MCP-API-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Backend API ${path} returned ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  async get(path: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'X-MCP-API-Key': this.apiKey },
    });
    if (!res.ok) {
      throw new Error(`Backend API ${path} returned ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }
}
