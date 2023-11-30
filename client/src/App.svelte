<script>
    import Home from './pages/Home/Home.svelte';
    import Admin from './pages/Admin/Admin.svelte';
    import LoginSignup from './pages/LoginSignup/LoginSignup.svelte';
    import ResetPassword from './pages/ResetPassword/ResetPassword.svelte';
    import Schedule from './pages/Schedule/Schedule.svelte';
    import { onMount } from 'svelte';
    import toast, { Toaster } from 'svelte-french-toast';
    import { Router, Link, Route, navigate } from 'svelte-navigator';
    import PrivateRoute from './component/PrivateRoutes/PrivateRoute.svelte';
    import { user } from './stores/userStore.js';
    import { BASE_URL } from './stores/global.js';
    import LostPassword from './pages/LostPassword/LostPassword.svelte';
    import NoPermission from './pages/NoPermission/NoPermission.svelte';
    import { checkAuthStatus } from './component/Authentication/authentication.js';
    import DarkmodeSwitch from './component/Darkmode/DarkmodeSwitch.svelte';
    import FaCalendarCheck from 'svelte-icons/fa/FaCalendarCheck.svelte';
    import FaHome from 'svelte-icons/fa/FaHome.svelte';
    import FaUserCog from 'svelte-icons/fa/FaUserCog.svelte';
    import FaSignOutAlt from 'svelte-icons/fa/FaSignOutAlt.svelte';

    let isLoading = true;
    let isAuthenticated = false;

    async function logout() {
        try {
            const response = await fetch($BASE_URL + '/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                user.set(null);
                navigate('/');
                toast(data.message, { icon: '✌️' });
            } else {
                toast.error('Logout failed.');
            }
        } catch (error) {
            console.error('Failed to logout', error);
            toast.error('An error occurred while logging out.');
        }
    }

    onMount(async () => {
        await checkAuthStatus();
        isLoading = false;
    });

    $: isAuthenticated = $user !== null;
    $: if (!$user) {
        navigate('/');
    }
</script>

<Toaster />
<Router>
    {#if !isLoading}
        {#if isAuthenticated}
            <nav class="sidebar">
                <img src="/img/g_icon_white.png" alt="Logo" style="height: 70px; margin-bottom:40px;" />
                <Link to="/">
                    <div class="icon">
                        <FaHome />
                        <div class="tooltip">Home</div>
                    </div>
                </Link>
                <Link to="/schedule">
                    <div class="icon">
                        <FaCalendarCheck />
                        <div class="tooltip">Schedule</div>
                    </div>
                </Link>
                {#if $user.isAdmin === 1}
                    <Link to="/admin">
                        <div class="icon">
                            <FaUserCog />
                            <div class="tooltip">Admin</div>
                        </div>
                    </Link>
                {/if}
                <button on:click={logout} class="icon-button">
                    <div class="icon">
                        <FaSignOutAlt />
                        <div class="tooltip">Logout</div>
                    </div>
                </button>

                <DarkmodeSwitch />
            </nav>
            <main>
                <Route path="/" component={Home} />
                <Route path="/schedule" component={Schedule} />
                <Route path="/no-permission" component={NoPermission} />
                <PrivateRoute path="/admin"><Admin /></PrivateRoute>
            </main>
        {:else}
            <main>
                <Route path="*" component={LoginSignup} />
                <Route path="/forgottenPassword" component={LostPassword} />
                <Route path="/reset-password" component={ResetPassword} />
            </main>
        {/if}
    {:else}
        <img src="./img/infinite-spinner.svg" style="width:100px height=100px" alt="Spinner" />
    {/if}
</Router>

<style>
    .sidebar {
        height: 100vh;
        width: 100px;
        background-color: #1b1c23;
        padding: 20px;
        position: fixed;
        top: 0;
        left: 0;
    }

    main {
        margin-left: 100px;
        padding: 20px;
    }

    :global(body) {
        background-color: #f8f5ef;
        transition: background-color 0.3s;
        color: #1b1c23;
    }

    :global(body.dark-mode) {
        background-color: #272936;
        color: #bfc2c7;
    }

    .icon {
        width: 30px;
        height: 30px;
        color: #f0f0f0;
        display: block;
        color: #f0f0f0;
        text-decoration: none;
        margin-bottom: 25px;
        margin-left: 30px;
    }

    .icon:hover {
        transform: scale(120%);
        color: #535bf2;
    }

    .icon-button {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        cursor: pointer;
        margin-bottom: 25px;
    }

    .icon-button:hover .icon {
        transform: scale(120%);
    }

    .icon .tooltip {
        visibility: hidden;
        width: 100px;
        background-color: #fff;
        color: #535bf2;
        text-align: center;
        border-radius: 6px;
        padding: 8px 0;
        position: absolute;
        margin-left: 45px;
        margin-top: -38px;
        z-index: -1;
    }

    .icon:hover .tooltip {
        visibility: visible;
    }
</style>
