<script lang="ts">
  import * as d3 from "d3";
  import { Location, Product, BilateralTradeYear } from "../models/models";
  import { browser } from "$app/environment";
  import Example from "../components/Example.svelte";
  import LineChart from "../components/LineChart.svelte";
  import BarChart from "../components/BarChart.svelte";

  let country1 = 7;
  let country2 = 15;

  let locationData: Map<number, Location> = new Map();
  let productData: Map<number, Product> = new Map();
  // maps reporting country to partner country then list of trades
  let bilateralData: Map<number, Map<number, BilateralTradeYear[]>> = new Map();

  if (browser) {
    Promise.all([
      d3.csv(window.location.href + "data/location.csv"),
      d3.csv(window.location.href + "data/hs_product.csv"),
      d3.csv(window.location.href + "data/hs_2020.csv"),
    ]).then(([l, p, b]) => {
      locationData = d3.index(
        l.map((v) => new Location(v)),
        (v) => v.id
      );
      productData = d3.index(
        p.map((v) => new Product(v)),
        (v) => v.id
      );
      for (let [k, v] of productData) {
        v.parent = productData.get(v.parent_id) ?? null;
        productData.set(k, v);
      }
      bilateralData = d3.group(
        b.map((v) => new BilateralTradeYear(locationData, productData, v)),
        (v) => v.location_id,
        (v) => v.partner_id
      );
    });
  }
</script>

<h1>Welcome</h1>

<!-- <Example locationMap={locationData}/> -->
<LineChart {bilateralData} {country1} {country2} {productData} {locationData} />

<BarChart {country1} {country2} {bilateralData} />

<style>
</style>
