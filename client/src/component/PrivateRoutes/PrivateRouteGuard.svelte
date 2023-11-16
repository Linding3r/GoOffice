<script>
    import { useNavigate, useLocation } from "svelte-navigator";
    import { user } from "../../stores/userStore";
  
    const navigate = useNavigate();
    const location = useLocation();
  
    $: if ($user.isAdmin === 0) {
      navigate("/no-permission", {
        state: { from: $location.pathname },
        replace: true,
      });
    }
  </script>
  
  {#if $user.isAdmin === 1}
    <slot />
  {/if}
  