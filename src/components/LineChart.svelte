<script lang="ts">
  import * as d3 from "d3";
  import {
    type Location,
    type Product,
    BilateralTradeYear,
  } from "../models/models";
  export let bilateralData: Map<number, Map<number, BilateralTradeYear[]>>;
  export let locationData: Map<number, Location>;
  export let productData: Map<number, Product>;
  export let country1: number;
  export let country2: number;
  const formatter = d3.format("$.4s");
  $: tradeYearTotal = bilateralData
    .get(country1)
    ?.get(country2)
    ?.reduce(
      (acc, b) => {
        acc.export_value += b.export_value;
        acc.import_value += b.import_value;
        return acc;
      },
      new BilateralTradeYear(locationData, productData, {
        location_id: country1,
        partner_id: country2,
        product_id: 0,
        year: 2020,
        export_value: 0,
        import_value: 0,
      })
    );
</script>

<div id="line-chart" class="viz-section">
{#if tradeYearTotal}
  <p>{country1}</p>
  <p>{country2}</p>
  <p>{formatter(tradeYearTotal.export_value ?? 0)}</p>
  <p>{formatter(tradeYearTotal.import_value ?? 0)}</p>
{:else}
  <p>Loading data...</p>
{/if}
</div>

<style>
</style>