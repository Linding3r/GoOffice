<script>
    import { onMount } from 'svelte';
    import { navigate } from 'svelte-navigator';
    import toast, { Toaster } from 'svelte-french-toast';
    import { BASE_URL } from '../../stores/global.js';

    let token;
    let newPassword = '';
    let confirmPassword = '';

    onMount(() => {
        const queryParams = new URLSearchParams(window.location.search);
        token = queryParams.get('token');

        if (!token) {
            toast.error('No reset token provided.');
            navigate('/');
        }
    });

    async function resetPassword(event) {
        event.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }

        toast.promise(
            fetch(`${$BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            })
                .then(async response => {
                    if (!response.ok) {
                        const data = await response.json();
                        return await Promise.reject(data.message);
                    }
                    
                    return response.json();
                })
                .then(data => {
                    navigate('/');
                    return data.message || 'Password successfully reset.';
                }),
            {
                loading: 'Resetting password...',
                success: 'Password Reset Successfully!',
                error: err => err || 'An error occurred while resetting the password.',
            }
        );
    }
</script>

<div class="container">
    <div class="form-container">
        <form on:submit|preventDefault={resetPassword}>
            <h1 style="margin-bottom: 20px">Reset Password</h1>
            <input type="password" bind:value={newPassword} placeholder="New Password" required />
            <input type="password" bind:value={confirmPassword} placeholder="Confirm New Password" required />
            <button style="margin-top: 20px;">Reset Password</button>
            <a href="/">Go to Sign In</a>
        </form>
    </div>
</div>

<Toaster />

<style>

    * {
        box-sizing: border-box;
    }

    h1 {
        font-weight: bold;
        margin: 0;
        color: #333;
    }

    a {
        margin-top: 20px;
    }

    button {
        border-radius: 20px;
        border: 1px solid #304d9d;
        background-color: #304d9d;
        color: #ffffff;
        font-size: 12px;
        font-weight: bold;
        padding: 12px 45px;
        letter-spacing: 1px;
        text-transform: uppercase;
        width: 60%;
    }

    button:active {
        transform: scale(0.95);
    }

    button:focus {
        outline: none;
    }

    form {
        background-color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 0 50px;
        height: 100%;
        text-align: center;
    }

    input {
        background-color: #eee;
        color: #333;
        border: none;
        padding: 12px 15px;
        margin: 8px 0;
        width: 80%;
    }

    .container {
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
        position: relative;
        overflow: hidden;
        width: 500px;
        max-width: 100%;
        min-height: 480px;
        margin-left: -50px;
    }

    .form-container {
        position: absolute;
        top: 0;
        height: 100%;
        transition: all 0.6s ease-in-out;
    }
</style>
