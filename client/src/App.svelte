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
    import LostPassword from './pages/LostPassword/LostPassword.svelte';
    import NoPermission from './pages/NoPermission/NoPermission.svelte';
    import { checkAuthStatus } from './component/Authentication/authentication.js';
    import DarkmodeSwitch from './component/Darkmode/DarkmodeSwitch.svelte';
    import FaCalendarCheck from 'svelte-icons/fa/FaCalendarCheck.svelte';
    import FaHome from 'svelte-icons/fa/FaHome.svelte';
    import FaCog from 'svelte-icons/fa/FaCog.svelte';
    import FaCoffee from 'svelte-icons/fa/FaCoffee.svelte';
    import FaSignOutAlt from 'svelte-icons/fa/FaSignOutAlt.svelte';
    import { BASE_URL } from './stores/global.js';
    import { Plane } from 'svelte-loading-spinners';
    import OfficeManager from './pages/OfficeManager/OfficeManager.svelte';
    import Badge from './component/Badge/Badge.svelte';
    import FaUserAstronaut from 'svelte-icons/fa/FaUserAstronaut.svelte';
    import Profile from './pages/Profile/Profile.svelte';
    import io from 'socket.io-client';

    const socket = io($BASE_URL);
    let isLoading = true;
    let isAuthenticated = false;
    let userUpdateNumber = 0;
    let userNewsNumber = 0;

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
            toast.error('An error occurred while logging out.');
        }
    }

    async function fetchUserUpdateNumber() {
        try {
            const response = await fetch($BASE_URL + '/api/user-updates');
            if (response.status === 204) {
                userUpdateNumber = 0;
                return;
            }
            if (response.ok) {
                const data = await response.json();
                if (data.updates) {
                    userUpdateNumber = data.updates.length;
                }
            }
        } catch (error) {}
    }

    async function fetchUserNewsNumber() {
        try {
            const response = await fetch($BASE_URL + '/api/news/get-unread-number');
            if (response.status === 204) {
                userUpdateNumber = 0;
                return;
            }
            if (response.ok) {
                const data = await response.json();
                if (data.number) {
                    userNewsNumber = data.number;
                }
            }
        } catch (error) {}
    }

    async function fetchUserData() {
        await fetchUserUpdateNumber();
        await fetchUserNewsNumber();
    }

    onMount(async () => {
        await checkAuthStatus();
        socket.on('updateNotification', fetchUserUpdateNumber);
        socket.on('newsNotification', fetchUserNewsNumber);
        isLoading = false;
    });

    $: isAuthenticated = $user !== null;
    $: userUpdateNumber = userUpdateNumber;
    $: userNewsNumber = userNewsNumber;
    $: $user && fetchUserData();
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
                        {#if userNewsNumber > 0}
                            <Badge count={userNewsNumber} />
                        {/if}
                        <div class="tooltip">Home</div>
                    </div>
                </Link>
                <Link to="/schedule">
                    <div class="icon">
                        <FaCalendarCheck />
                        <div class="tooltip">Schedule</div>
                    </div>
                </Link>
                {#if $user.isAdmin === 1 || $user.departmentId === 7}
                    <Link to="/office">
                        <div class="icon">
                            <FaCoffee />
                            <div class="tooltip">Office</div>
                        </div>
                    </Link>
                {/if}
                {#if $user.isAdmin === 1}
                    <Link to="/admin">
                        <div class="icon">
                            <FaCog />
                            <div class="tooltip">Admin</div>
                        </div>
                    </Link>
                {/if}
                <Link to="/profile">
                    <div class="icon">
                        <FaUserAstronaut />
                        {#if userUpdateNumber > 0}
                            <Badge count={userUpdateNumber} />
                        {/if}
                        <div class="tooltip">Profile</div>
                    </div>
                </Link>
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
                <Route path="/office" component={OfficeManager}></Route>
                <Route path="/profile" component={Profile}></Route>
            </main>
        {:else}
            <main>
                <Route path="*" component={LoginSignup} />
                <Route path="/forgottenPassword" component={LostPassword} />
                <Route path="/reset-password" component={ResetPassword} />
            </main>
        {/if}
    {:else}
        <Plane size="100" color="#535bf2" unit="px" />
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
</style>
