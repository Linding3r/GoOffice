<script>
    import toast, { Toaster } from 'svelte-french-toast';
    import { navigate } from 'svelte-navigator';
    import DarkmodeSwitch from '../../component/Darkmode/DarkmodeSwitch.svelte';
    import { Link } from 'svelte-navigator';


    let registeredEmail;

    async function requestNewPassword() {
        toast.promise(
            fetch('/api/auth/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: registeredEmail }),
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => Promise.reject(data.message));
                    }
                    return response.json();
                })
                .then(() => {
                    registeredEmail = '';
                    navigate('/');
                }),
            {
                loading: 'Sending reset link...',
                success: 'Reset Link Sent Successfully!',
                error: err => err || 'Error sending reset link',
            }
        );
    }
</script>

<Toaster />
<div class="switch"><DarkmodeSwitch /></div>
<div class="container">
    <div class="form-container sign-in-container">
        <form on:submit|preventDefault={requestNewPassword}>
            <h1 style="margin-bottom: 20px">Request New Password</h1>
            <input type="email" bind:value={registeredEmail} placeholder="Email" required />
            <button style="margin-top: 15px;">Request Reset Link</button>
            <Link to="/"><div class="link">Back to Sign In</div></Link>
        </form>
    </div>
</div>

<style>
    * {
        box-sizing: border-box;
    }

    .switch {
        position: absolute;
        right: 10px;
        top: 15px;
    }

    h1 {
        font-weight: bold;
        margin: 0;
        color: #333;
    }
    .link {
        margin-top: 20px;
    }

    button {
        border-radius: 20px;
        border: 1px solid #1b1c23;
        background-color: #1b1c23;
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
        box-shadow:
            0 14px 28px rgba(0, 0, 0, 0.25),
            0 10px 10px rgba(0, 0, 0, 0.22);
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
