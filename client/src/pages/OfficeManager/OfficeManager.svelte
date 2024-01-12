<script>
    import { onMount } from 'svelte';
    import toast, { Toaster } from 'svelte-french-toast';
    import { SyncLoader } from 'svelte-loading-spinners';

    let selectedWeek = '';
    let workforceData = [];
    let loading = true;

    function getWeekOptions() {
        const currentWeek = getWeekNumber(new Date().toISOString().split('T')[0]);
        const currentYear = new Date().getFullYear();
        let weeks = [];

        for (let i = currentWeek; i <= 52; i++) {
            weeks.push({ week: i, year: currentYear });
        }
        for (let i = 1; i < currentWeek; i++) {
            weeks.push({ week: i, year: currentYear + 1 });
        }

        return weeks;
    }

    async function fetchWorkforceData(week, year) {
        if (!week) return;
        try {
            const response = await fetch(`/api/office/${year}/${week}`);
            if (response.ok) {
                workforceData = await response.json();
                loading = false;
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            toast.error('Error fetching workforce data: ' + error.message);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    function getWeekNumber(dateString) {
        const date = new Date(dateString);
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    onMount(() => {
        const currentWeek = getWeekNumber(new Date().toISOString().split('T')[0]);
        const currentYear = new Date().getFullYear();
        selectedWeek = `${currentYear}-${currentWeek}`;
        fetchWorkforceData(currentWeek, currentYear);
    });
</script>

<Toaster />
{#if loading}
    <SyncLoader size="100" color="#535bf2" unit="px" />
{:else if workforceData.length > 0}
    <div class="container">
        <h1>Office Manager</h1>
        <p>Select a week number to check how many will be at the office</p>
        <div class="dropdown-container">
            <select
                bind:value={selectedWeek}
                on:change={() => {
                    const [year, week] = selectedWeek.split('-');
                    fetchWorkforceData(parseInt(week), parseInt(year));
                }}
            >
                <option value="">Select a Week</option>
                {#each getWeekOptions() as { week, year }}
                    <option value={`${year}-${week}`}>Week {week} ({year})</option>
                {/each}
            </select>
        </div>
        <div class="workforce-container">
            {#each workforceData as dayData}
                <div class="day-row">
                    <div class="date">{formatDate(dayData.bookingDate)}</div>
                    {#if dayData.status === 'Office Closed'}
                        <div class="amount">{dayData.status}</div>
                    {:else}
                        <div class="amount">{dayData.status} at office</div>
                    {/if}
                </div>
            {/each}
        </div>
    </div>
{/if}

<style>
    .container {
        max-width: calc(100vw - 150px);
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        margin: 20px auto;
        max-width: calc(100vw - 140px);
    }
    .dropdown-container {
        margin: 20px;
        text-align: center;
    }

    .workforce-container {
        margin: 20px auto;
        max-width: 600px;
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .day-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 0;
        border-bottom: 1px solid #eee;
    }

    .date {
        font-weight: bold;
    }

    .amount {
        color: #555;
        font-size: 0.9em;
        margin-left: 20px;
    }

    select {
        padding: 10px;
        border-radius: 4px;
        border: 1px solid #ddd;
        font-size: 1em;
    }
</style>
