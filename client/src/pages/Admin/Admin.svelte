<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import toast, { Toaster } from 'svelte-french-toast';

    const users = writable([]);

    let today = new Date().toISOString().split('T')[0];
    let closedFrom = today;
    let closedTo = '';
    let closedReason = '';
    let closedDays = [];

    const departments = [
        { id: 1, name: 'Annotation' },
        { id: 2, name: 'Platform' },
        { id: 3, name: 'Machine Learning' },
        { id: 4, name: 'Sales' },
        { id: 5, name: 'Marketing' },
    ];

    function handleUserUpdate(user, field, event) {
        const selectElement = event.target;
        let value = selectElement.value;

        if (field === 'is_fulltime' || field === 'is_admin') {
            value = value === 'true';
        } else if (field === 'department_id') {
            value = parseInt(value);
        }

        const updatedUser = { ...user, [field]: value };
        updateUser(updatedUser);
    }

    async function fetchUsers() {
        const response = await fetch('/api/users/get-all');
        if (response.ok) {
            const data = await response.json();
            users.set(data.users);
        }
    }

    async function updateUser(user) {
        const response = await fetch('/api/users/update-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user }),
        });
        if (response.ok) {
            toast.success(`Successfully updated ${user.name}`);
        } else {
            toast.error('Failed to update user!');
        }
    }

    async function addClosedPeriod() {
        if (!closedFrom || !closedTo || !closedReason) {
            toast.error('Please fill all fields.');
            return;
        }
        try {
            const response = await fetch('/api/closed-days', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_date: closedFrom,
                    end_date: closedTo,
                    reason: closedReason,
                }),
            });

            if (response.ok) {
                toast.success('Successfully added closed period');
                fetchClosedDays();
            } else {
                toast.error('Error adding closed period');
            }
        } catch (error) {
            toast.error('Error adding closed period: ', error);
        }
    }

    async function fetchClosedDays() {
        try {
            const response = await fetch('/api/closed-days');
            if (response.ok) {
                closedDays = await response.json();
            } else {
                toast.error('Error fetching closed days');
            }
        } catch (error) {
            toast.error('Error fetching closed days: ', error);
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    async function deleteClosedDay(id) {
    try {
        const response = await fetch(`/api/closed-days/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
        });

        if (response.ok) {
            toast.success('Closed day removed successfully');
            closedDays = closedDays.filter(day => day.id !== id);
        } else {
            const errorData = await response.json();
            toast.error('Failed to remove closed day: ' + errorData.message);
        }
    } catch (error) {
        toast.error('Error removing closed day: ' + error.message);
    }
}


    onMount(() => {
        fetchUsers();
        fetchClosedDays();
    });
</script>

<Toaster />
<section class="admin-container">
    <div class="admin-section">
        <h2 class="section-title">Manage Closed Periods</h2>
        <div class="input-section">
            <div class="input-group">
                <label for="closedFrom">From Date</label>
                <input type="date" id="closedFrom" bind:value={closedFrom} min={today} />
            </div>
            <div class="input-group">
                <label for="closedTo">To Date</label>
                <input type="date" id="closedTo" bind:value={closedTo} min={closedFrom} />
            </div>
            <div class="input-group">
                <label for="closedReason">Reason</label>
                <input type="text" id="closedReason" bind:value={closedReason} placeholder="Reason"/>
            </div>
            <button on:click={addClosedPeriod} class="add-button">Add Closed Period</button>
        </div>

        <div class="table-container">
            <table class="closed-days-table">
                <thead>
                    <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Reason</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {#each closedDays as closedDay (closedDay.id)}
                        <tr>
                            <td>{formatDate(closedDay.start_date)}</td>
                            <td>{formatDate(closedDay.end_date)}</td>
                            <td>{closedDay.reason}</td>
                            <td>
                                <button class="delete-button" on:click={() => deleteClosedDay(closedDay.id)}>Delete</button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>

    <div class="admin-section">
        <h2 class="section-title">User Management</h2>
        <div class="users-list">
            {#each $users as user (user.id)}
                <div class="user-item">
                    <div class="user-name">{user.name}</div>
                    <div class="user-email">{user.email}</div>
                    <div class="user-actions">
                        <select on:change={event => handleUserUpdate(user, 'is_fulltime', event)}>
                            <option value="true" selected={user.is_fulltime}>Full-time</option>
                            <option value="false" selected={!user.is_fulltime}>Part-time</option>
                        </select>
                        <select on:change={event => handleUserUpdate(user, 'department_id', event)}>
                            {#each departments as department}
                                <option value={department.id} selected={department.id === user.department_id}>{department.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>
            {/each}
        </div>
    </div>
</section>


<style>
    .users-list {
        margin-top: 20px;
    }
    .user-item {
        display: flex;
        align-items: left;
        padding: 10px;
        border-bottom: 1px solid #ccc;
    }
    .user-name,
    .user-email {
        flex: 1;
        font-size: 16px;
        padding: 0 10px;
    }
    .user-name {
        text-align: left;
    }
    .user-email {
        text-align: right;
    }
    select {
        margin-left: 10px;
    }

    
    .closed-days-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    .closed-days-table,
    .closed-days-table th,
    .closed-days-table td {
        border: 1px solid #ddd;
        padding: 8px;
    }

    .closed-days-table th {
        text-align: left;
        background-color: #f2f2f2;
    }

    .delete-button {
        background-color: #ff6b6b;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    }

    .delete-button:hover {
        background-color: #ff4c4c;
    }



    button {
        padding: 10px 20px;
        background-color: #535bf2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        margin-top: 10px;
        transition: background-color 0.3s ease;
    }

    button:hover {
        background-color: #414aad;
    }

    input[type='date']:disabled {
        background-color: #f0f0f0;
        color: #999;
    }

    input[type='date'],
    input[type='text'] {
        width: 100%;
        padding: 10px;
        margin: 5px 0;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
        font-size: 16px;
    }

    input[type='date']:focus,
    input[type='text']:focus {
        outline: none;
        border-color: #535bf2;
        box-shadow: 0 0 5px rgba(83, 91, 242, 0.5);
    }

    .admin-container {
        display: grid;
        gap: 20px;
        padding: 20px;
    }

    .admin-section {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 20px;
    }

    .section-title {
        margin: 0 0 20px 0;
    }

    .input-section {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
    }

    .input-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    input, select, .add-button, .delete-button {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
    }

    .add-button {
        background-color: #535bf2;
        color: white;
        cursor: pointer;
    }

    .add-button:hover {
        background-color: rgb(51, 61, 240);
    }

    .delete-button:hover {
        background-color: #ff4c4c;
    }


    :global(body.dark-mode) .admin-container,
    :global(body.dark-mode) .admin-section {
        background-color: #272936; 
        color: #bfc2c7; 
    }

    :global(body.dark-mode) .closed-days-table,
    :global(body.dark-mode) .closed-days-table th,
    :global(body.dark-mode) .closed-days-table td {
        background-color: #1b1c23; 
        color: #bfc2c7;
    }

    :global(body.dark-mode) .input-group label,
    :global(body.dark-mode) .section-title {
        color: #bfc2c7; 
    }

    :global(body.dark-mode) input[type='date'],
    :global(body.dark-mode) input[type='text'] {
        background-color: #333; 
        color: #bfc2c7; 
    }

    :global(body.dark-mode) input[type='date']:focus,
    :global(body.dark-mode) input[type='text']:focus {
        box-shadow: 0 0 5px rgba(83, 91, 242, 0.5); 
    }

    :global(body.dark-mode) .add-button:hover {
        background-color: rgb(51, 61, 240); 
    }

    :global(body.dark-mode) .delete-button:hover {
        background-color: #ff4c4c; 
    }

</style>
