<script lang="ts">
    import type {Location} from "../models/models";
    export let locationMap : Map<number, Location>;
</script>


{#each [...locationMap] as [location_id, location]}
    <p>{location.name}</p>
{/each}