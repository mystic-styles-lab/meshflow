import { $fetch } from "ofetch";

// Use Marzban's proxy endpoint instead of direct connection
const BALANCER_BASE = "/api/balancer";

const balancerFetch = $fetch.create({
  baseURL: "",
});

export const balancerApi = {
  proxies: {
    getAll: () => balancerFetch(`${BALANCER_BASE}/proxies`),
    getById: (id: number) => balancerFetch(`${BALANCER_BASE}/proxies/${id}`),
    create: (data: any) => balancerFetch(`${BALANCER_BASE}/proxies`, { method: "POST", body: data }),
    update: (id: number, data: any) => balancerFetch(`${BALANCER_BASE}/proxies/${id}`, { method: "PUT", body: data }),
    delete: (id: number) => balancerFetch(`${BALANCER_BASE}/proxies/${id}`, { method: "DELETE" }),
    toggle: (id: number, enabled: boolean) => balancerFetch(`${BALANCER_BASE}/proxies/${id}/toggle`, { method: "POST", body: { enabled } }),
    test: (id: number) => balancerFetch(`${BALANCER_BASE}/proxies/${id}/test`, { method: "POST" }),
    testAll: () => balancerFetch(`${BALANCER_BASE}/proxies/test-all`, { method: "POST" }),
  },
  stats: {
    get: () => balancerFetch(`${BALANCER_BASE}/stats`),
  },
  logs: {
    stream: () => `${BALANCER_BASE}/logs/stream`,
  },
};
