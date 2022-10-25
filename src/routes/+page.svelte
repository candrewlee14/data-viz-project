<script lang="ts">
    import * as d3 from "d3";
    import { Location, Product, BilateralTradeYear } from "../models/models";
    import { browser } from "$app/environment";
    import Example from "../components/Example.svelte";

    let locationData: Map<number, Location> = new Map();
    let productData: Map<number, Product> = new Map();
    let bilateralData: Map<number, BilateralTradeYear> = new Map();

    if (browser) {
        d3.csv(window.location.href + "data/location.csv").then((d) => {
            locationData = d3.index(
                d.map((v) => new Location(v)),
                (v) => v.id
            );
        });
        d3.csv(window.location.href + "data/hs_product.csv").then((d) => {
            productData = d3.index(
                d.map((v) => new Product(v)),
                (v) => v.id
            );
        });
        d3.csv(window.location.href + "data/hs_2020.csv").then((d) => {
            bilateralData = d3.index(
                d.map((v) => new BilateralTradeYear(v)),
                (v) => v.location_id
            );
        });
    }
</script>

<h1>Welcome</h1>

<Example locationMap={locationData}/>

<style>
</style>
