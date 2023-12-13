<script>
    export let message = '';
    export let onConfirm = () => {};
    export let onCancel = () => {};
</script>

<div class="modal-backdrop">
    <div class="modal">
        <p>{message}</p>
        <button on:click={onConfirm}>Yes</button>
        <button on:click={onCancel}>No</button>
    </div>
</div>

<style>
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
    }
    button {
        margin: 10px;
        background-color: #535bf2;
    }

    :global(body.dark-mode) .modal {
        background-color: #272936;
    }

</style>
