<script>
    import Home from './pages/Home/Home.svelte';
    import Admin from './pages/Admin/Admin.svelte';
    import LoginSignup from './pages/LoginSignup/LoginSignup.svelte';
    import ResetPassword from './pages/ResetPassword/ResetPassword.svelte';
    import Schedule from './pages/Schedule/Schedule.svelte';
    import { onMount } from 'svelte';
    import toast, { Toaster } from 'svelte-french-toast';
    import { Router, Link, Route } from 'svelte-navigator';
    import PrivateRoute from './component/PrivateRoutes/PrivateRoute.svelte';
    import { user } from './stores/userStore.js';
    import { BASE_URL } from './stores/global.js';
    import LostPassword from './pages/LostPassword/LostPassword.svelte';
    import NoPermission from './pages/NoPermission/NoPermission.svelte';
    import { checkAuthStatus } from './component/Authentication/authentication.js';
    import DarkmodeSwitch from './component/Darkmode/DarkmodeSwitch.svelte';
    import FaCalendarCheck from 'svelte-icons/fa/FaCalendarCheck.svelte'
    import FaHome from 'svelte-icons/fa/FaHome.svelte'
    import FaUserCog from 'svelte-icons/fa/FaUserCog.svelte'
    import FaSignOutAlt from 'svelte-icons/fa/FaSignOutAlt.svelte'

    async function logout() {
        try {
            const response = await fetch($BASE_URL + '/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
            const data = await response.json();
            if (response.ok) {
                user.set(null);
                toast(data.message, { icon: '✌️' });
            } else {
                toast.error('Logout failed.');
            }
        } catch (error) {
            console.error('Failed to logout', error);
            toast.error('An error occurred while logging out.');
        }
    }

    let isLoading = true;

    onMount(async () => {
        await checkAuthStatus();
        isLoading = false;
        if ($user) {
            toast(`Welcome back ${$user.name}!`, { icon: '👋' });
        }
    });
</script>

<Toaster />
<Router>
    {#if $user && !isLoading}
        <nav class="sidebar">
            <img src="/img/g_icon_white.png" alt="Logo" style="height: 70px; margin-bottom:40px;" />
            <Link to="/"><div class="icon"><FaHome/></div></Link>
            <Link to="/schedule"><div class="icon"><FaCalendarCheck/></div></Link>
            {#if $user.isAdmin === 1}
                <Link to="/admin"><div class="icon"><FaUserCog/></div></Link>
            {/if}
            <button on:click={logout}><div class="icon"><FaSignOutAlt/></div></button>
            <DarkmodeSwitch/>
        </nav>
    {/if}

    <main>
        {#if $user && !isLoading}
            <Route path="/" component={Home} />
            <Route path="/schedule" component={Schedule} />
            <Route path="/no-permission" component={NoPermission} />
            <PrivateRoute path="/admin"><Admin /></PrivateRoute>
        {:else if !isLoading}
            <Route path="*" component={LoginSignup} />
            <Route path="/forgottenPassword" component={LostPassword} />
            <Route path="/reset-password" component={ResetPassword} />
        {:else}
            <img src="/img/infinite-spinner.svg" style="width:100px height=100px" alt="Spinner" />
        {/if}
    </main>
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
        color: #4c6fff
    }

    :global(body.dark-mode) {
        background-color: #1d3040;
        color: #bfc2c7;
    }

    .icon {
    width: 30px;
    height: 30px;
    color: #f0f0f0;
    display: block;
    color: #f0f0f0;
    text-decoration: none;
    margin-bottom: 10px;
    margin-left: 15px;
  }

  .icon:hover{
    transform: scale(120%);
  }

</style>