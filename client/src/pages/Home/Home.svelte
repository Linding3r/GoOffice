<script>
    import { onMount } from 'svelte';
    import io from 'socket.io-client';
    import { BASE_URL } from '../../stores/global';
    import { user } from '../../stores/userStore';
    import toast, { Toaster } from 'svelte-french-toast';

    let newsItems = [];
    const socket = io($BASE_URL);

    onMount(() => {
        if ($user) {
            fetchInitialNews();
            socket.on('newsUpdate', fetchInitialNews);
        }
        return () => {
            socket.disconnect();
        };
    });

    async function fetchInitialNews() {
        try {
            const response = await fetch($BASE_URL + '/api/news/get-all');
            if (response.ok) {
                const data = await response.json();
                if (data.news) {
                    newsItems = data.news.reverse();
                }
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Server responded with an error');
            }
        } catch (error) {
            toast.error('An error occurred while fetching news: ' + error.message);
        }
    }
</script>

<section>
    <Toaster />
    <h2>Latest News</h2>
    <div class="news-container">
        {#each newsItems as newsItem (newsItem.id)}
            <div class="news-item">
                <h3>{newsItem.title}</h3>
                <p>{newsItem.description}</p>
                <small>{new Date(newsItem.time).toLocaleString()}</small>
            </div>
        {/each}
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
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
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
        background-color: #272936; 
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
