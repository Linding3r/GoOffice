<script>
    import { onMount } from 'svelte';
    import io from 'socket.io-client';
    import { user } from '../../stores/userStore';
    import toast, { Toaster } from 'svelte-french-toast';
    import { formatDate } from '../../util/fromatDate';

    let today = new Date().toISOString().split('T')[0];
    let updateItems = [];
    const socket = io();
    let showUserUpdates = false;
    let showVacation = false;
    let showUserSettings = false;
    let isVegan = false;
    let isVegetarian = false;
    let vacationStart = today;
    let vacationEnd = '';
    let userVacations = [];
    let isFulltime = false

    const pageTitle = 'Go Office | Profile';

    onMount(() => {
        if ($user) {
            document.title = pageTitle;
            isFulltime = $user.isFulltime;
            fetchInitialUpdates();
            fetchUserVacations();
            socket.on('updateNotification', fetchInitialUpdates);
        }
        return () => {
            socket.disconnect();
        };
    });

    async function fetchUserVacations() {
        try {
            const response = await fetch(`/api/users/vacations`);
            if (response.ok) {
                let vacation = await response.json();
                if(vacation.length > 0){
                    userVacations = vacation
                }
            } else {
                toast.error('Failed to fetch vacation data');
            }
        } catch (error) {
            toast.error('Error fetching vacation data: ' + error.message);
        }
    }

    async function addVacation() {
        if (!vacationStart || !vacationEnd) {
            toast.error('Please fill all fields.');
            return;
        }
        try {
            const response = await fetch('/api/users/vacation-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_date: vacationStart,
                    end_date: vacationEnd,
                }),
            });

            if (response.ok) {
                toast.success('Vacation added successfully');
                vacationStart = today;
                vacationEnd = '';
                fetchUserVacations();
            } else {
                toast.error('Error adding vacation');
            }
        } catch (error) {
            toast.error('Error adding vacation: ', error);
        }
    }

    async function updateDietaryPreferences() {
        try {
            const response = await fetch(`/api/users/dietary-preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isVegetarian,
                    isVegan,
                }),
            });
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            toast.success('Dietary preferences updated successfully');
        } catch (error) {
            toast.error('Error updating dietary preferences: ' + error.message);
        }
    }

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

    async function deleteVacation(vacationId) {
        try {
            const response = await fetch(`/api/users/vacations/${vacationId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Vacation deleted successfully');
                userVacations = userVacations.filter(vacation => vacation.id !== vacationId);
            } else {
                toast.error('Failed to delete vacation');
            }
        } catch (error) {
            toast.error('Error deleting vacation: ' + error.message);
        }
    }

    function handleKeyPress(event, updateId) {
        if (event.key === 'Enter' || event.key === ' ') {
            markAsRead(updateId);
        }
    }

    function toggleSection(section) {
        if (section === 'userUpdates') {
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
                <input type="checkbox" bind:checked={isVegetarian} on:change={updateDietaryPreferences} />
            </label>
            <label>
                Vegan
                <input type="checkbox" bind:checked={isVegan} on:change={updateDietaryPreferences} />
            </label>
        {/if}
    </div>
{#if isFulltime}
    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('vacation')}>
            <h2 class="section-title">
                Vacation
                <span class="dropdown-arrow">{showVacation ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showVacation}
            <div class="input-section">
                <div class="input-group">
                    <label for="vacationStart">Start Date</label>
                    <input type="date" id="vacationStart" bind:value={vacationStart} min={today} />
                </div>
                <div class="input-group">
                    <label for="vacationEnd">End Date</label>
                    <input type="date" id="vacationEnd" bind:value={vacationEnd} min={vacationStart} />
                </div>

                <button on:click={addVacation} class="add-button">Add Vacation</button>
            </div>
            {#each userVacations as vacation (vacation.id)}
                <div class="vacation-item">
                    <span>From: {formatDate(vacation.start_date)} To: {formatDate(vacation.end_date)}</span>
                    <button class="delete-button" on:click={() => deleteVacation(vacation.id)}>Delete</button>
                </div>
            {/each}
        {/if}
    </div>
    {/if}
</section>

<style>
    .vacation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        border-bottom: 1px solid #eee;
    }

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

    input[type='date'] {
        width: 100%;
        padding: 10px;
        margin: 5px 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
        font-size: 16px;
    }

    input[type='date']:focus {
        outline: none;
        border-color: #535bf2;
        box-shadow: 0 0 5px rgba(83, 91, 242, 0.5);
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
