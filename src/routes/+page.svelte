<script lang="ts">
    import * as d3 from "d3";
    import {csv} from "d3-fetch";
    import Location from "../models/models"
    import { browser } from '$app/environment';

    let locationData : Location[] = [];

    if (browser) {
        csv(window.location.href + "data/location.csv").then(d => {
            locationData = d.map(v => {
                return new Location(v)
            });
        });
    }
</script>

<h1>Welcome</h1>

{#each locationData as location}
    <p>{location.name}</p>
{/each}

