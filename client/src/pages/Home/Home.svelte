<script>
    import { onMount } from 'svelte';
    import io from 'socket.io-client';
    import { user } from '../../stores/userStore';
    import toast, { Toaster } from 'svelte-french-toast';
    import EditNewsModal from '../../component/EditNewsModal/EditNewsModal.svelte';
    import { SyncLoader } from 'svelte-loading-spinners';

    let newsItems = [];
    const socket = io();
    let loading = true;
    const pageTitle = 'Go Office | Home';

    let currentPage = 1;
    const itemsPerPage = 3;

    let showNewsEditModal = false;
    let newsTitle = '';
    let newsDescription = '';
    let newsId = '';
    let isAdmin = false;

    $: paginatedNewsItems = newsItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    onMount(() => {
        if ($user) {
            isAdmin = $user.isAdmin;
            document.title = pageTitle;
            setTimeout(fetchInitialNews, 100);
            socket.on('newsUpdate', fetchInitialNews);
        }
        return () => {
            socket.disconnect();
        };
    });

    async function fetchInitialNews() {
        try {
            const response = await fetch('/api/news/get-all');
            if (!response.ok) {
                throw new Error('Server responded with an error');
            }
            const data = await response.json();
            newsItems = data.news || [];
            loading = false;
        } catch (error) {
            toast.error('An error occurred while fetching news: ' + error.message);
        }
    }

    async function updateNews(newsId, title, description) {
        try {
            const response = await fetch(`/api/news/${newsId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, description }),
            });
            if (!response.ok) {
                throw new Error('Server responded with an error');
            }
            closeEditNewsModal();
            fetchInitialNews();
            toast.success('News successfully updated');
        } catch (error) {
            toast.error('An error occurred while updating news: ' + error.message);
        }
    }

    async function deleteNews(newsId) {
        try {
            const response = await fetch(`/api/news/${newsId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) {
                throw new Error('Server responded with an error');
            }
            toast.success('News successfully deleted');
        } catch (error) {
            toast.error('An error occured while deleting news: ' + error.message);
        }
    }

    async function markNewsAsRead(newsId) {
    try {
        const response = await fetch(`/api/news/read/${newsId}`, { method: 'POST' });
        if (!response.ok) {
            throw new Error('Server responded with an error');
        }
        newsItems = newsItems.map(newsItem => 
            newsItem.id === newsId ? { ...newsItem, has_read: 1 } : newsItem
        );
    } catch (error) {
        toast.error('An error occurred: ' + error.message);
    }
}


    function getTotalPages() {
        return Math.ceil(newsItems.length / itemsPerPage);
    }

    function formatNewsContent(content) {
        content = content.replace(/#(\w+)/g, '<span style="color:blue">#$1</span>');

        content = content.replace(/__(.+?)__/g, '<span style="font-weight:bold;">$1</span>');

        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/gi;
        content = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        return content.replace(/\n/g, '<br>');
    }

    function handleKeyPress(event, newsId) {
        if (event.key === 'Enter' || event.key === ' ') {
            markNewsAsRead(newsId);
        }
    }

    function closeEditNewsModal() {
        newsId = '';
        newsTitle = '';
        newsDescription = '';
        showNewsEditModal = false;
    }

    function openEditNewsModal(id, title, description) {
        showNewsEditModal = true;
        newsId = id;
        newsTitle = title;
        newsDescription = description;
    }
</script>

{#if showNewsEditModal}
    <EditNewsModal
        title={newsTitle}
        description={newsDescription}
        onEditNews={(title, description) => updateNews(newsId, title, description)}
        onCloseModal={closeEditNewsModal}
    />
{/if}
<Toaster />
{#if loading}
    <SyncLoader size="100" color="#1b1c23" unit="px" />
{:else}
    <section>
        <h2>Latest News</h2>
        <div class="news-container">
            {#each paginatedNewsItems as newsItem (newsItem.id)}
                <div
                    class="news-item"
                    tabindex="0"
                    on:click={() => markNewsAsRead(newsItem.id)}
                    on:keydown={event => handleKeyPress(event, newsItem.id)}
                    role="button"
                    aria-pressed="false"
                >
                    {#if isAdmin}
                        <button class="edit-pen" on:click={() => openEditNewsModal(newsItem.id, newsItem.title, newsItem.description)}>Edit</button>
                        <button class="delete" on:click={() => deleteNews(newsItem.id)}>Delete</button>
                    {/if}
                    {#if newsItem.has_read === 0}
                        <span class="badge">!</span>
                    {/if}
                    <h3>{newsItem.title}</h3>
                    <p>{@html formatNewsContent(newsItem.description)}</p>
                    {#if newsItem.edited == null}
                        <small>{new Date(newsItem.time).toLocaleString()}</small>
                    {:else}
                        <small>edited - {new Date(newsItem.edited).toLocaleString()}</small>
                    {/if}
                </div>
            {/each}
        </div>
        <div class="pagination-controls">
            <button on:click={() => (currentPage = Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Previous</button>
            <button on:click={() => (currentPage = Math.min(getTotalPages(), currentPage + 1))} disabled={currentPage === getTotalPages()}>Next</button>
        </div>
    </section>
{/if}

<style>
    .news-item p {
        text-align: left;
        margin-left: 30px;
        margin-top: 30px;
    }
    .edit-pen {
        position: absolute;
        left: 0px;
        top: 0px;
        height: 20;
        background-color: #535bf2;
        font-size: x-small;
    }
    .delete {
        position: absolute;
        left: 50px;
        top: 0px;
        height: 20;
        background-color: #ff6b6b;
        font-size: x-small;
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

    .pagination-controls {
        display: flex;
        justify-content: center;
        margin-top: 20px;
    }

    .pagination-controls button {
        padding: 5px 10px;
        margin: 0 5px;
        background-color: #535bf2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .pagination-controls button:hover {
        background-color: #414aad;
    }

    .pagination-controls button:disabled {
        background-color: #ccc;
        cursor: default;
    }

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

    .news-container {
        width: 100%;
        max-width: 800px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 20px;
    }

    .news-item {
        background-color: #f2f2f2;
        min-width: 600px;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
        position: relative;
        transition:
            transform 0.2s ease-in-out,
            box-shadow 0.2s ease-in-out;
    }

    .news-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px rgba(83, 91, 242, 0.2);
    }

    .news-item h3 {
        color: #414aad;
        margin-top: 0;
    }

    .news-item p {
        color: #333;
    }

    .news-item small {
        display: block;
        color: #999;
        margin-top: 10px;
        font-size: 0.8em;
    }

    :global(body.dark-mode) h2 {
        color: #a3a8f0;
    }

    :global(body.dark-mode) .news-container {
        background-color: #1e1f27;
        color: #bfc2c7;
    }

    :global(body.dark-mode) .news-item {
        background-color: #1b1c23;
        color: #bfc2c7;
    }

    :global(body.dark-mode) .news-item h3 {
        color: #a3a8f0;
    }

    :global(body.dark-mode) .news-item p {
        color: #bfc2c7;
    }

    :global(body.dark-mode) .news-item small {
        color: #717781;
    }
</style>
