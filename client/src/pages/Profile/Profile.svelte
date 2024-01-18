<script>
    import { onMount } from 'svelte';
    import io from 'socket.io-client';
    import { user } from '../../stores/userStore';
    import toast, { Toaster } from 'svelte-french-toast';

    let updateItems = [];
    const socket = io();
    let showOfficeDays = false;
    let showUserUpdates = false;
    let showVacation = false;
    let showUserSettings = false;
    let isVegan = false;
    let isVegetarian = false;
    let dietries = '';
    let customHomeDays = false;
    let workHomeDays = [];
    const pageTitle = 'Go Office | Profile'

    onMount(() => {
        if ($user) {
            document.title = pageTitle;
            fetchInitialUpdates();
            socket.on('updateNotification', fetchInitialUpdates);
        }
        return () => {
            socket.disconnect();
        };
    });

    async function fetchInitialUpdates() {
        try {
            const response = await fetch('/api/user-updates');
            if (response.status === 204) {
                updateItems = [];
                return;
            }
            if (response.ok) {
                const data = await response.json();
                if (data.updates) {
                    updateItems = data.updates;
                }
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Server responded with an error');
            }
        } catch (error) {
            toast.error('An error occurred while fetching updates: ' + error.message);
        }
    }

    async function markAsRead(updateId) {
        try {
            const response = await fetch(`/api/user-updates/read/${updateId}`, { method: 'PUT' });
            if (response.ok) {
                fetchInitialUpdates();
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Server responded with an error');
            }
        } catch (error) {
            toast.error('An error occurred: ' + error.message);
        }
    }

    function handleKeyPress(event, updateId) {
        if (event.key === 'Enter' || event.key === ' ') {
            markAsRead(updateId);
        }
    }

    function toggleSection(section) {
        if (section === 'officeWorkDays') {
            showOfficeDays = !showOfficeDays;
        } else if (section === 'userUpdates') {
            showUserUpdates = !showUserUpdates;
        } else if (section === 'vacation') {
            showVacation = !showVacation;
        } else if (section === 'userSettings') {
            showUserSettings = !showUserSettings;
        }
    }
</script>

<section>
    <Toaster />
    <div class="admin-section">
        {#if updateItems.length > 0}
            <span class="badge">{updateItems.length}</span>
        {/if}
        <button class="section-title-button" on:click={() => toggleSection('userUpdates')}>
            <h2 class="section-title">
                Updates
                <span class="dropdown-arrow">{showUserUpdates ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showUserUpdates}
            {#if updateItems.length === 0}
                <p>No updates.</p>
            {:else}
                <p>Click on an update to mark it as read.</p>

                {#each updateItems as updateItem (updateItem.id)}
                    <div
                        class="update-item"
                        tabindex="0"
                        on:click={() => markAsRead(updateItem.id)}
                        on:keydown={event => handleKeyPress(event, updateItem.id)}
                        role="button"
                        aria-pressed="false"
                    >
                        <p>{@html updateItem.update_description}</p>
                        <small>{new Date(updateItem.update_time).toLocaleString()}</small>
                    </div>
                {/each}
            {/if}
        {/if}
    </div>

    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('userSettings')}>
            <h2 class="section-title">
                User Settings
                <span class="dropdown-arrow">{showUserSettings ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showUserSettings}
            <h3>Dietary requirements</h3>
            <label>
                Vegetarian
                <input type="checkbox" bind:checked={isVegetarian} />
            </label>
            <label>
                Vegan
                <input type="checkbox" bind:checked={isVegan} />
            </label>
            <label>
                Other Diatries
                <input type="text" bind:value={dietries} />
            </label>
        {/if}
    </div>

    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('officeWorkDays')}>
            <h2 class="section-title">
                Office Days
                <span class="dropdown-arrow">{showOfficeDays ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showOfficeDays}
            <label>
                <input type="checkbox" bind:checked={customHomeDays} />
                Add reacuring home work days.
            </label>
            {#if customHomeDays}
                <div class="weekdayBox">
                    <h4>Chose which days you wish to work from home.</h4>
                        <label>
                            <input type="checkbox" bind:checked={workHomeDays[0]} />
                            Monday
                        </label>
                        <label>
                            <input type="checkbox" bind:checked={workHomeDays[1]} />
                            Tuesday
                        </label>
                        <label>
                            <input type="checkbox" bind:checked={workHomeDays[2]} />
                            Wednesday
                        </label>
                        <label>
                            <input type="checkbox" bind:checked={workHomeDays[3]} />
                            Thursday
                        </label>
                        <label>
                            <input type="checkbox" bind:checked={workHomeDays[4]} />
                            Friday
                        </label>
                </div>
            {:else}
                <p></p>
            {/if}
        {/if}
    </div>

    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('vacation')}>
            <h2 class="section-title">
                Vacation & Days Off
                <span class="dropdown-arrow">{showVacation ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showVacation}
            <!--Mark vacation-->
            <p>Vacation</p>
        {/if}
    </div>
</section>

<style>
    .badge {
        background-color: red;
        color: white;
        padding: 0px 7px;
        border-radius: 50%;
        font-size: 0.8em;
        position: absolute;
        transform: translate(50%, -50%);
        top: 0px;
        right: 0px;
    }
    section {
        display: grid;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        padding: 20px;
    }

    .update-item {
        background-color: #f2f2f2;
        min-width: 600px;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        transition:
            transform 0.2s ease-in-out,
            box-shadow 0.2s ease-in-out,
            outline 0.3s ease;
        cursor: pointer;
        outline: none;
    }

    .update-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px rgba(83, 91, 242, 0.2);
    }

    .update-item:focus {
        box-shadow: 0 0 0 3px rgba(83, 91, 242, 0.6);
        transform: scale(1.02);
    }

    .update-item p {
        color: #333;
    }

    .update-item small {
        display: block;
        color: #999;
        margin-top: 10px;
        font-size: 0.8em;
    }

    .admin-section {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 20px;
        min-width: 700px;
        position: relative;
    }

    .section-title {
        margin: 0 0 20px 0;
        cursor: pointer;
        user-select: none;
    }

    .section-title-button {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        text-align: left;
        width: 100%;
        cursor: pointer;
        color: black;
    }

    .section-title-button:hover {
        background-color: #f2f2f2;
    }

    .dropdown-arrow {
        font-size: 18px;
        margin-left: 10px;
        align-items: end;
    }

    :global(body.dark-mode) .section-title {
        color: #bfc2c7;
    }

    :global(body.dark-mode) section {
        color: #bfc2c7;
    }

    :global(body.dark-mode) .update-item {
        background-color: #252630;
        color: #bfc2c7;
    }

    :global(body.dark-mode) .update-item p {
        color: #bfc2c7;
    }

    :global(body.dark-mode) .update-item small {
        color: #717781;
    }

    :global(body.dark-mode) .update-item:focus {
        box-shadow: 0 0 0 3px rgba(163, 168, 240, 0.6);
    }
    :global(body.dark-mode) .admin-section {
        color: #bfc2c7;
        background-color: #1b1c23;
    }


    :global(body.dark-mode) .section-title-button:hover {
        background-color: #333;
    }
</style>
