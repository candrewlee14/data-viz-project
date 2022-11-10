<script lang="ts">
  import * as d3 from "d3";
  import { Location, Product, BilateralTradeYear } from "../models/models";
  import { onMount } from "svelte";
  import Select from "svelte-select";
  import Example from "../components/Example.svelte";
  import LineChart from "../components/LineChart.svelte";
  import BarChart from "../components/BarChart.svelte";

  const optionIdentifier = "id";
  const labelIdentifier = "name";
  let country1 = 31;
  let country2 = 15;

  const onSelectCountry1 = (e: any) => {
    let l = e.detail as Location;
    country1 = l.id;
  };
  const onSelectCountry2 = (e: any) => {
    let l = e.detail as Location;
    country2 = l.id;
  };

  $: country1Name = locationData.get(country1)?.name ?? "";
  $: country2Name = locationData.get(country2)?.name ?? "";

  let locationData: Map<number, Location> = new Map();

  let countryColorScale: d3.ScaleOrdinal<number, string, never>;

  let productData: Map<number, Product> = new Map();
  // maps reporting country to partner country then list of trades
  let bilateralData: Map<number, Map<number, BilateralTradeYear[]>> = new Map();
  let exportExtent: [number, number];

  onMount(async () => {
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
      // @ts-ignore
      exportExtent = d3.extent(b, (v) => +v["export_value"]!);

      countryColorScale = d3.scaleOrdinal(
        locationData.keys(),
        d3.schemeTableau10
      );
    });
  });
</script>

<h1>Welcome</h1>
<div class="selectors">
<div class="dropdown">
  <span>Country 1</span>
  <Select
    {optionIdentifier}
    {labelIdentifier}
    items={Array.from(locationData.values())}
    on:select={onSelectCountry1}
  />
</div>
<div class="dropdown">
  <span>Country 2</span>
  <Select
    {optionIdentifier}
    {labelIdentifier}
    items={Array.from(locationData.values())}
    on:select={onSelectCountry2}
  />
</div>
</div>
<!-- <Example locationMap={locationData}/> -->
<div id="container">
  <div id="content">
    <LineChart
      {bilateralData}
      {country1}
      {country2}
      {productData}
      {locationData}
    />

    <BarChart
      {country1}
      {country1Name}
      {country2}
      {country2Name}
      {bilateralData}
      {countryColorScale}
    />
  </div>
</div>

<style>
  #container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  #content {
    display: flex;
    flex-direction: row;
    justify-content: center;
    max-width: 1700px;
  }
  :global(.viz-section) {
    width: 800px;
    height: 40vh;
    border: 1px solid black;
    margin: 20px;
    padding: 0;
  }
  .selectors {
    width: 100%;
    display: flex;
    margin: 0;
    flex-direction: row;
    justify-content: center;
  }
  .dropdown {
    margin: 0 10px 0 10px;
    width: 300px;
  }
</style>
