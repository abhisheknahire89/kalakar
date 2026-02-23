// Supabase Configuration
// Replace these with your actual Supabase project credentials.
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

let client;

try {
    // If the credentials are placeholders, the URL parsing will intentionally throw.
    client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
    console.warn("⚠️ Valid Supabase credentials not found. Utilizing Mock Authentication Flow.");

    // Mock fallback to keep the frontend operational
    client = {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            signInWithOtp: async ({ phone }) => {
                alert("Mock Mode: Simulating OTP sent to " + phone);
                return { data: {}, error: null };
            },
            verifyOtp: async ({ phone, token }) => {
                if (token === '000000') {
                    return { data: { session: true }, error: null };
                } else {
                    return { data: null, error: new Error('Use mock OTP: 000000') };
                }
            },
            getUser: async () => ({ data: { user: { id: 'mock_user_1', phone: '+919999999999' } } })
        },
        from: (table) => ({
            select: async () => ({ data: [], error: null }),
            insert: async () => ({ data: [], error: null }),
            update: async () => ({ data: [], error: null }),
            eq: () => ({ ilike: async () => ({ data: [], error: null }) })
        }),
        storage: {
            from: () => ({
                upload: async () => ({ data: {}, error: null }),
                getPublicUrl: () => ({ data: { publicUrl: 'https://via.placeholder.com/300' } })
            })
        }
    };
}

// Export for use in app.js
window.supabaseClient = client;
