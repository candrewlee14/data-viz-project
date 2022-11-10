<script lang="ts">
  import type { Location, Product, BilateralTradeYear } from "../models/models";
  export let bilateralData: Map<number, Map<number, BilateralTradeYear[]>>;
  // export let locationData: Map<number, Location>;
  // export let productData: Map<number, Product>;
  export let country1: number;
  export let country2: number;

  $: tradeData =
    bilateralData
      .get(country1)
      ?.get(country2)
      ?.filter((v) => v.product.level == "section");
</script>
{#if tradeData}
{#each tradeData as bt (bt.product.name)}
  <hr />
  <p>{bt.product.name}</p>
  <div>
    <div>
      <p>{bt.location.name}</p>
      <p>{bt.export_value}</p>
    </div>
    <div>
      <p>{bt.partner.name}</p>
      <p>{bt.import_value}</p>
    </div>
  </div>
  <hr />
{/each}
{:else}
  <p>Loading data...</p>
{/if}



