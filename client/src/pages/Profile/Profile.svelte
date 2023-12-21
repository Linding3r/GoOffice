<script>
    import { onMount } from 'svelte';
    import io from 'socket.io-client';
    import { BASE_URL } from '../../stores/global';
    import { user } from '../../stores/userStore';
    import toast, { Toaster } from 'svelte-french-toast';

    let updateItems = [];
    const socket = io($BASE_URL);


    onMount(() => {
        if ($user) {
            fetchInitialUpdates();
            socket.on('updateNotification', fetchInitialUpdates);
        }
        return () => {
            socket.disconnect();
        };
    });

    async function fetchInitialUpdates() {
        try {
            const response = await fetch($BASE_URL + '/api/user-updates');
            if(response.status === 204) {
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
            const response = await fetch($BASE_URL + `/api/user-updates/read/${updateId}`, { method: 'POST' });
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

</script>

<section>
    <Toaster />
    <h2>User Updates</h2>
    <div class="updates-container">
        {#if updateItems.length === 0}
            <p>No updates.</p>
        {:else}
            <p>Click on an update to mark it as read.</p>
        
        {#each updateItems as updateItem (updateItem.id)}
            <div 
                class="update-item" 
                tabindex="0" 
                on:click={() => markAsRead(updateItem.id)}
                on:keydown={(event) => handleKeyPress(event, updateItem.id)}
                role="button" 
                aria-pressed="false"
            >
                <p>{@html updateItem.update_description}</p>
                <small>{new Date(updateItem.update_time).toLocaleString()}</small>
            </div>
        {/each}
        {/if}
    </div>
</section>

<style>
section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 20px;
}

h2 {
    color: #535bf2;
    margin: 0;
}

.updates-container {
    width: 100%;
    max-width: 800px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
}

.update-item {
    background-color: #f2f2f2;
    min-width: 600px;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 10px;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, outline 0.3s ease;
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

:global(body.dark-mode) section {
    background-color: #1e1f27;
    color: #bfc2c7;
}

:global(body.dark-mode) .updates-container {
    background-color: #1b1c23;
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

</style>
