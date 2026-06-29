import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid - ignore if we are already on login page or check-in
            const isRestrictedPath = window.location.pathname.startsWith('/admin/dashboard');

            if (isRestrictedPath) {
                console.warn('Session expired or unauthorized. Logging out...');
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                window.location.href = '/admin?expired=true';
            }
        }

        // Global Downtime & Isolation Handler (503)
        if (error.response && error.response.status === 503) {
            if (!window.downtimeRendered) {
                window.downtimeRendered = true;
                console.error('SERVER DOWNTIME DETECTED: Rendering barrier...');
                // Replace the entire page with the server's premium HTML safely
                document.documentElement.innerHTML = error.response.data;

                // Execute scripts in the injected HTML so the self-recovery monitoring works
                const scripts = document.documentElement.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            }
            return new Promise(() => {}); // Prevent further error handling in the app
        }
        return Promise.reject(error);
    }
);

export default api;
