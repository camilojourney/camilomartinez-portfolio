// Minimal WHOOP API client abstraction. Expand as needed.
export interface WhoopClientOptions {
	accessToken: string;
	baseUrl?: string;
}

export class WhoopClient {
	private accessToken: string;
	private baseUrl: string;

	constructor(opts: WhoopClientOptions) {
		this.accessToken = opts.accessToken;
		this.baseUrl = opts.baseUrl ?? 'https://api.prod.whoop.com/developer/v2';
	}

	private async request<T>(path: string, init?: RequestInit): Promise<T> {
		const res = await fetch(`${this.baseUrl}${path}`, {
			...init,
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				'Content-Type': 'application/json',
				...(init?.headers || {})
			}
		});
		if (!res.ok) throw new Error(`WHOOP API ${res.status} ${res.statusText}`);
		return res.json() as Promise<T>;
	}

	getRecentRecovery(limit = 7) {
		return this.request<{ records: any[] }>(`/recovery?limit=${limit}`);
	}
}
