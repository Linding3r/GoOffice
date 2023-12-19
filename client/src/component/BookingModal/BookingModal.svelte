<script>
    import FaTimes from 'svelte-icons/fa/FaTimes.svelte';
    export let onMorningJoin = () => {};
    export let onAfternoonJoin = () => {};
    export let onRemoveFromWaitlist = id => {};
    export let onCancel = () => {};
    export let isFullyBookedMorning = false;
    export let isFullyBookedAfternoon = false;
    export let waitlist = [];
    export let user = {};
    export let morningBooked = false;
    export let afternoonBooked = false;

    function alreadyOnWaitlist(shift_type) {
        return waitlist.some(request => request.user_id === user.userId && request.shift === shift_type);
    }

    function findWaitlistId(shift_type) {
        let entry = waitlist.find(request => request.user_id === user.userId && request.shift === shift_type);
        return entry.id;
    }


</script>

<div class="modal-backdrop">
    <div class="modal">
        <button class="close" on:click={onCancel}>
            <FaTimes />
        </button>
        <h3>Waiting List</h3>
        
        {#if alreadyOnWaitlist('morning')}
            <button class="delete" on:click={() => onRemoveFromWaitlist(findWaitlistId('morning'))}>Remove from Morning</button>
        {:else}
            <button disabled={isFullyBookedMorning || morningBooked} on:click={onMorningJoin}>Join Morning</button>
        {/if}
        {#if alreadyOnWaitlist('afternoon')}
            <button class="delete" on:click={() => onRemoveFromWaitlist(findWaitlistId('afternoon'))}>Remove from Afternoon</button>
        {:else}
            <button disabled={isFullyBookedAfternoon || afternoonBooked} on:click={onAfternoonJoin}>Join Afternoon</button>
        {/if}

        {#if waitlist.length > 0}
            <h4>Waitlist</h4>
            <ul>
                {#each waitlist as waitlistUser}
                    <li>{waitlistUser.name} - {waitlistUser.shift}</li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

<style>
    .close {
        position: absolute;
        top: 0px;
        right: 0px;
        background-color: transparent;
        border: none;
        cursor: pointer;
        height: 40px;
        color: #272936;
    }
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .modal {
        background-color: #f9f9f9;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        position: relative;
    }
    button {
        margin: 10px;
        background-color: #535bf2;
    }

    button.delete {
        background-color: #ff6b6b;
    }

    button:disabled {
        background-color: #ccc;
    }

    :global(body.dark-mode) .modal {
        background-color: #272936;
    }

    :global(body.dark-mode) .close {
        color: #f9f9f9;
    }
</style>
