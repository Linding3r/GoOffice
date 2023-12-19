<script>
    export let count = 0;
</script>

<span class="badge">{count}</span>

<style>
    .badge {
        background-color: red;
        color: white;
        padding: 0px 5px;
        border-radius: 50%;
        font-size: 0.7em;
        position: absolute;
        transform: translate(50%, -50%);
    }
</style>
