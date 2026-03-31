import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

export const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Waits for Firebase to resolve its auth state, then returns the ID token.
 * This avoids the race condition where auth.currentUser is null on first mount
 * even though the user is actually logged in.
 */
export const getAuthToken = (): Promise<string | null> => {
    return new Promise((resolve) => {
        // 1. Fast path: check current user
        if (auth.currentUser) {
            auth.currentUser.getIdToken().then(resolve).catch(() => resolve(null));
            return;
        }

        // 2. Wait path: wait for auth state change
        const timeout = setTimeout(() => {
            unsubscribe();
            resolve(null);
        }, 3000); // 3s timeout

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            clearTimeout(timeout);
            unsubscribe();
            if (user) {
                user.getIdToken().then(resolve).catch(() => resolve(null));
            } else {
                resolve(null);
            }
        });
    });
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = await getAuthToken();
    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(url, { ...options, headers });
    
    if (!res.ok) {
        // Log detailed error for debugging
        const text = await res.text();
        console.error(`[API ERROR] ${url} returned ${res.status}:`, text);
        try {
            // Re-wrap the body so the caller can still read it once
            const blob = new Blob([text], { type: 'application/json' });
            return new Response(blob, {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers
            });
        } catch (e) {
            return res;
        }
    }
    
    return res;
};
