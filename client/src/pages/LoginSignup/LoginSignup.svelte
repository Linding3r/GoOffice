<script>
    import toast from 'svelte-french-toast';
    import { navigate } from 'svelte-navigator';
    import { user } from '../../stores/userStore.js';
    import { BASE_URL } from '../../stores/global.js';
    import { checkAuthStatus } from '../../component/Authentication/authentication.js'

    let rightPanelActive = false;

    function togglePanel() {
        rightPanelActive = !rightPanelActive;
    }

    let loginEmail;
    let loginPassword;
    let confirmPassword;
    let signupPassword;
    let signupEmail;
    let name;

    async function login() {
        toast.promise(
            fetch($BASE_URL + '/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            })
                .then(response => {
                    if (response.status === 429) {
                        toast.error('Too many requests. Please try again later.');
                    }
                    if (!response.ok) {
                        return response.json().then(data => Promise.reject(data.message));
                    }
                    return response.json();
                })
                .then(async data => {
                    user.set(data);
                    await checkAuthStatus();
                    navigate('/');
                }),
            {
                loading: 'Logging in...',
                success: 'Successfully logged in',
                error: err => err || 'Could not login',
            }
        );
    }

    function clearSignUp() {
        name = '';
        signupEmail = '';
        signupPassword = '';
        confirmPassword = '';
    }

    async function signUp() {
        if (signupPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        toast.promise(
            fetch($BASE_URL + '/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: signupEmail, password: signupPassword, name: name }),
            })
                .then(response => {
                    if (response.status === 429) {
                        return response.json().then(data => Promise.reject('Too many requests. Please try again later.'));
                    }
                    if (!response.ok) {
                        return response.json().then(data => Promise.reject(data.message));
                    }
                    return response.json();
                })
                .then(data => {
                    togglePanel();
                    clearSignUp();
                }),
            {
                loading: 'Signing up...',
                success: 'Successfully signed up. Please login with your credentials',
                error: err => err || 'Could not sign up',
            }
        );
    }
</script>

<div class="container" class:right-panel-active={rightPanelActive}>
    <div class="form-container sign-up-container">
        <form on:submit|preventDefault={signUp}>
            <h1>Create Account</h1>
            <input type="text" bind:value={name} placeholder="Name" required />
            <input type="email" bind:value={signupEmail} placeholder="Email" required />
            <input type="password" bind:value={signupPassword} placeholder="Password" required />
            <input type="password" bind:value={confirmPassword} placeholder="Confirm Password" required />
            <button style="margin-top: 20px;">Sign Up</button>
        </form>
    </div>
    <div class="form-container sign-in-container">
        <form class="signin-form" on:submit|preventDefault={login}>
            <h1 style="margin-bottom: 20px">Sign in</h1>
            <input type="email" bind:value={loginEmail} placeholder="Email" required />
            <input type="password" bind:value={loginPassword} placeholder="Password" required />
            <button style="margin-top: 20px;">Sign In</button>
            <a href="/forgottenPassword">Forgot your password?</a>
        </form>
    </div>
    <div class="overlay-container">
        <div class="overlay">
            <div class="overlay-panel overlay-left">
                <h1>Welcome Back!</h1>
                <p>Log in with your personal information to come back to where you left of!</p>
                <button class="ghost" on:click={togglePanel}>Sign In</button>
            </div>
            <div class="overlay-panel overlay-right">
                <h1>Hello, Friend!</h1>
                <p>Enter your personal details to create a new account!</p>
                <button class="ghost" on:click={togglePanel}>Sign Up</button>
            </div>
        </div>
    </div>
</div>

<style>


    * {
        box-sizing: border-box;
    }

    h1 {
        font-weight: bold;
        margin: 0;
    }

    p {
        font-size: 14px;
        font-weight: 400;
        line-height: 20px;
        letter-spacing: 0.5px;
        margin: 20px 0 30px;
    }

    a {
        margin-top: 30px;
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
        transition: transform 80ms ease-in;
    }

    button:active {
        transform: scale(0.95);
    }

    button:focus {
        outline: none;
    }

    button.ghost {
        background-color: transparent;
        border-color: #ffffff;
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

    .signin-form {
        margin-top: 25px;
    }

    input {
        background-color: #eee;
        color: #333;
        border: none;
        padding: 12px 15px;
        margin: 8px 0;
        width: 100%;
    }

    .container {
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
        position: relative;
        overflow: hidden;
        width: 768px;
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

    .sign-in-container {
        left: 0;
        width: 50%;
        z-index: 2;
    }

    .sign-in-container h1 {
        color: #333;
    }

    .sign-up-container h1 {
        color: #333;
    }

    .container.right-panel-active .sign-in-container {
        transform: translateX(100%);
    }

    .sign-up-container {
        left: 0;
        width: 50%;
        opacity: 0;
        z-index: 1;
    }

    .container.right-panel-active .sign-up-container {
        transform: translateX(100%);
        opacity: 1;
        z-index: 5;
        animation: show 0.6s;
    }

    @keyframes show {
        0%,
        49.99% {
            opacity: 0;
            z-index: 1;
        }

        50%,
        100% {
            opacity: 1;
            z-index: 5;
        }
    }

    .overlay-container {
        position: absolute;
        top: 0;
        left: 50%;
        width: 50%;
        height: 100%;
        overflow: hidden;
        transition: transform 0.6s ease-in-out;
        z-index: 100;
    }

    .container.right-panel-active .overlay-container {
        transform: translateX(-100%);
    }

    .overlay {
        background: #304d9d;
        background: -webkit-linear-gradient(to right, #304d9d, #4161b7);
        background: linear-gradient(to right, #304d9d, #4161b7);
        background-repeat: no-repeat;
        background-size: cover;
        background-position: 0 0;
        color: #ffffff;
        position: relative;
        left: -100%;
        height: 100%;
        width: 200%;
        transform: translateX(0);
        transition: transform 0.6s ease-in-out;
    }

    .container.right-panel-active .overlay {
        transform: translateX(50%);
    }

    .overlay-panel {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        padding: 0 40px;
        text-align: center;
        top: 0;
        height: 100%;
        width: 50%;
        transform: translateX(0);
        transition: transform 0.6s ease-in-out;
    }

    .overlay-left {
        transform: translateX(-20%);
    }

    .container.right-panel-active .overlay-left {
        transform: translateX(0);
    }

    .overlay-right {
        right: 0;
        transform: translateX(0);
    }

    .container.right-panel-active .overlay-right {
        transform: translateX(20%);
    }
</style>
