import axios from 'axios';

async function verify() {
    const API_URL = 'http://localhost:3000/api/v1';
    try {
        const login = await axios.post(`${API_URL}/auth/login`, {
            email: 'demo@example.com',
            password: 'password123'
        });
        const token = login.data.accessToken;
        const tenantId = login.data.user.tenant.id;

        const overview = await axios.get(`${API_URL}/dashboard/overview`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { period: '30d' }
        });

        const summary = overview.data.data.summary;
        console.log('--- DATA_VERIFIED_START ---');
        console.log('Impressions:', summary.totalImpressions);
        console.log('Clicks:', summary.totalClicks);
        console.log('Campaigns:', overview.data.data.recentCampaigns.length);
        console.log('--- DATA_VERIFIED_END ---');
    } catch (e: any) {
        console.log('FAILED:', e.response?.data || e.message);
    }
}
verify();
