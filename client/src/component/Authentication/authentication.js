import { user } from '../../stores/userStore.js';


export async function checkAuthStatus() {
    try {
        const response = await fetch('http://localhost:8080/api/checkAuth', {
            credentials: 'include',
        });
        const data = await response.json();
        if (data.isAuthenticated) {
            const userData = { name: data.name, isAdmin: data.is_admin };
            user.set(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } else {
            user.set(null);
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Failed to check authentication status', error);
    }
}