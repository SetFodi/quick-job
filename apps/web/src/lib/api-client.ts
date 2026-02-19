import { getSupabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getAuthHeaders() {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    return {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
}

export const api = {
    async get(path: string) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            headers,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    },

    async post(path: string, body?: any) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    },

    async patch(path: string, body?: any) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'PATCH',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    },

    async del(path: string) {
        const headers = await getAuthHeaders();
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'DELETE',
            headers,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || 'API request failed');
        }
        return response.json();
    },

    // Typed Wrappers
    wallets: {
        getBalance: () => api.get('/wallets/balance'),
        getTransactions: () => api.get('/wallets/transactions'),
        deposit: (userId: string, amount: string) => api.post(`/wallets/${userId}/deposit`, { amount }),
    },

    jobs: {
        getAll: () => api.get('/jobs'),
        getMine: () => api.get('/jobs/my'),
        getOne: (id: string) => api.get(`/jobs/${id}`),
        create: (data: any) => api.post('/jobs', data),
        delete: (id: string) => api.del(`/jobs/${id}`),
    },

    proposals: {
        create: (jobId: string, data: any) => api.post(`/jobs/${jobId}/proposals`, data),
        getForJob: (jobId: string) => api.get(`/jobs/${jobId}/proposals`),
        getMine: () => api.get('/my-proposals'),
        accept: (id: string) => api.patch(`/proposals/${id}/accept`),
        reject: (id: string) => api.patch(`/proposals/${id}/reject`),
    },

    escrow: {
        lockFunds: (milestoneId: string) => api.post(`/escrow/milestones/${milestoneId}/lock`),
        submitWork: (milestoneId: string) => api.post(`/escrow/milestones/${milestoneId}/submit`),
        releaseFunds: (milestoneId: string) => api.post(`/escrow/milestones/${milestoneId}/release`),
    },
};
