<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import io from 'socket.io-client';
    import { BASE_URL } from '../../stores/global';

    const newsItems = writable([]);

    onMount(() => {
        const socket = io($BASE_URL);

        fetchInitialNews();

        socket.on('newsUpdate', newNews => {
            newsItems.update(currentItems => [...currentItems, newNews]);
        });

        return () => {
            socket.disconnect();
        };
    });

    async function fetchInitialNews() {
        const response = await fetch('/api/news/get-all');
        if (response.ok) {
            const data = await response.json();
            if (data.news) {
                newsItems.set(data.news);
            }
        }
    }
</script>

<section>
    <h2>Latest News</h2>
    <div class="news-container">
        {#each $newsItems as newsItem (newsItem.id)}
            <div class="news-item">
                <h3>{newsItem.title}</h3>
                <p>{newsItem.description}</p>
                <small>{new Date(newsItem.time).toLocaleString()}</small>
            </div>
        {/each}
    </div>
</section>

<style>
    .news-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 1rem;
        background-color: #323232;
        border-radius: 10px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: left;
    }

    .news-item {
        padding: 1rem;
        margin-bottom: 1rem;
        background-color: #1a1a1a;
        border-radius: 8px;
        transition:
            transform 0.2s ease-in-out,
            box-shadow 0.2s ease-in-out;
    }

    .news-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    }

    .news-item h3 {
        color: #646cff;
        margin-top: 0;
    }

    .news-item p {
        color: rgba(255, 255, 255, 0.87);
        font-size: 1rem;
    }

    .news-item small {
        display: block;
        color: #999;
        margin-top: 1rem;
    }
</style>
