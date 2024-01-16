<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import toast, { Toaster } from 'svelte-french-toast';
    import { derived } from 'svelte/store';
    import { BASE_URL } from '../../stores/global.js';

    const searchQuery = writable('');
    const users = writable([]);

    let today = new Date().toISOString().split('T')[0];
    let closedFrom = today;
    let closedTo = '';
    let closedReason = '';
    let title = '';
    let description = '';
    let inputRef = null;
    let closedDays = [];
    let departments = [];
    let showScheduleManagement = false;
    let showDepartmentManagement = false;
    let showUserManagement = false;
    let showNewsManagement = false;
    let showLogs = false;

    const filteredUsers = derived([users, searchQuery], ([$users, $searchQuery]) => {
        return $users.filter(
            user => user.name.toLowerCase().includes($searchQuery.toLowerCase()) || user.email.toLowerCase().includes($searchQuery.toLowerCase())
        );
    });

    async function fetchDepartments() {
        const response = await fetch($BASE_URL + '/api/departments');
        if (response.ok) {
            const data = await response.json();
            departments = data;
        }
    }

    async function handleDepartmentUpdate(id) {
        let value = inputRef.value;
        try {
            const response = await fetch($BASE_URL + `/api/departments/update/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value }),
            });
            if (response.ok) {
                toast.success(`Successfully updated department`);
            } else {
                toast.error('Error updating department');
            }
        } catch (error) {
            toast.error('Error updating department: ', error);
        }
    }

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
        const response = await fetch($BASE_URL + '/api/users/get-all');
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
            const response = await fetch($BASE_URL + '/api/closed-days', {
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
                closedFrom = today;
                closedTo = '';
                closedReason = '';
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
            const response = await fetch($BASE_URL + '/api/closed-days');
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
            const response = await fetch($BASE_URL + `/api/closed-days/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
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

    function toggleSection(section) {
        if (section === 'scheduleManagement') {
            showScheduleManagement = !showScheduleManagement;
        } else if (section === 'departmentManagement') {
            showDepartmentManagement = !showDepartmentManagement;
        } else if (section === 'userManagement') {
            showUserManagement = !showUserManagement;
        } else if (section === 'newsManagement') {
            showNewsManagement = !showNewsManagement;
        } else if (section === 'logs') {
            showLogs = !showLogs;
        }
    }

    async function addNews() {
        try {
            const response = await fetch($BASE_URL + '/api/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                }),
            });

            if (response.ok) {
                title = '';
                description = '';
                toast.success('News added successfully');
            }
        } catch (error) {
            toast.error('An error occurred while adding news.');
        }
    }

    onMount(() => {
        fetchUsers();
        fetchClosedDays();
        fetchDepartments();
    });
</script>

<Toaster />
<section class="admin-container">
    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('newsManagement')}>
            <h2 class="section-title">
                News Management
                <span class="dropdown-arrow">{showNewsManagement ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showNewsManagement}
            <div class="news-input-section">
                <div class="input-group">
                    <label for="title">Title</label>
                    <input type="text" id="title" bind:value={title} placeholder="Title" />
                </div>
                <div class="input-group">
                    <label for="description">Description</label>
                    <textarea id="description" bind:value={description} placeholder="Description" rows="6"></textarea>
                </div>
                <button class="add-button" on:click={addNews}>Add News</button>
            </div>
        {/if}
    </div>

    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('scheduleManagement')}>
            <h2 class="section-title">
                Schedule Management
                <span class="dropdown-arrow">{showScheduleManagement ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showScheduleManagement}
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
                    <input type="text" id="closedReason" bind:value={closedReason} placeholder="Reason" />
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
        {/if}
    </div>

    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('departmentManagement')}>
            <h2 class="section-title">
                Department Management
                <span class="dropdown-arrow">{showDepartmentManagement ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showDepartmentManagement}
            {#each departments as department (department.id)}
                {#if department.id !== 7 && department.id !== 6}
                    <div class="user-item">
                        <div class="user-name">{department.name}</div>
                        <div class="input-group">
                            <label for="desk-number">Number of Desks</label>
                            <input bind:this={inputRef} type="number" id="desk-number" value={department.num_desks} />
                            <button on:click={() => handleDepartmentUpdate(department.id)}>Edit</button>
                        </div>
                    </div>
                {/if}
            {/each}
        {/if}
    </div>

    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('userManagement')}>
            <h2 class="section-title">
                User Management
                <span class="dropdown-arrow">{showUserManagement ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showUserManagement}
            <div class="search-box">
                <input type="text" placeholder="Search users..." bind:value={$searchQuery} />
            </div>
            <div class="users-list">
                {#each $filteredUsers as user (user.id)}
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
        {/if}
    </div>
    <div class="admin-section">
        <button class="section-title-button" on:click={() => toggleSection('logs')}>
            <h2 class="section-title">
                Logs
                <span class="dropdown-arrow">{showLogs ? '▲' : '▼'}</span>
            </h2>
        </button>
        {#if showLogs}
            Logs
        {/if}
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
        min-width: 700px;
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

    input,
    select,
    .add-button,
    .delete-button {
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

    .search-box input[type='text'] {
        margin-bottom: 20px;
        width: 100%;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }
    .news-input-section {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .input-group textarea {
        height: 150px;
        width: 100%;
        resize: vertical;
    }

    :global(body.dark-mode) .admin-section {
        color: #bfc2c7;
        background-color: #1b1c23;
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

    :global(body.dark-mode) .section-title-button:hover {
        background-color: #333;
    }
</style>
