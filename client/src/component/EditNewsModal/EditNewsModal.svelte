<script>
    import FaTimes from 'svelte-icons/fa/FaTimes.svelte';
    export let title = '';
    export let description = '';
    export let onEditNews = (title, description) => {};
    export let onCloseModal = () => {};
</script>

<div class="modal-backdrop">
    <div class="modal">
        <button class="close" on:click={onCloseModal}>
            <FaTimes />
        </button>
        <div class="input-group">
            <label for="title">Title</label>
            <input type="text" id="title" bind:value={title} placeholder="Title" />
        </div>
        <div class="input-group">
            <label for="description">Description</label>
            <textarea id="description" bind:value={description} placeholder="Description" rows="6"></textarea>
        </div>
        <button class="add-button" on:click={() => onEditNews(title, description)}>Edit News</button>
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
        z-index: 1;
    }
    .modal {
        background-color: #f9f9f9;
        padding: 20px;
        border-radius: 5px;
        margin-left: 100px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        position: relative;
    }
    button {
        margin: 10px;
        background-color: #535bf2;
    }

    .input-group textarea {
        height: 200px;
        width: 100%;
        resize: vertical;
        min-width: 650px;
    }

    .input-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    :global(body.dark-mode) .modal {
        background-color: #272936;
    }
</style>
