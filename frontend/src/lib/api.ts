// Central API base URL config
// In production: uses https://api.kakkashi.cloud
// In local dev:  uses http://localhost:8000
export const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
