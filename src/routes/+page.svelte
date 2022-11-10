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
  // 231 is USA
  const USA_ID = 231;
  // 43 is China
  const CHINA_ID = 43;

  $: country1 = locationData.get(USA_ID) ?? null;
  $: country2 = locationData.get(CHINA_ID) ?? null;

  const onSelectCountry1 = (e: any) => {
    let l = e.detail as Location;
    country1 = locationData.get(l.id)!;
  };
  const onSelectCountry2 = (e: any) => {
    let l = e.detail as Location;
    country2 = locationData.get(l.id)!;
  };

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
        l.map((v) => new Location(v)).filter((v) => v.level == "country"),
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

<div class="heading">
  <h1>Bilateral Trade Data</h1>
  <h2>Visualization by Andrew Lee and Franklin Yuan</h2>
</div>
<div class="selectors">
  <div
    class="country-icon"
    style={`background:${
      countryColorScale ? countryColorScale(country1?.id ?? 0) : "white"
    }`}
  />
  <div class="dropdown">
    <span>Country 1</span>
    <Select
      {optionIdentifier}
      {labelIdentifier}
      items={Array.from(locationData.values())}
      value={country1}
      on:select={onSelectCountry1}
    />
  </div>
  <div class="dropdown">
    <span>Country 2</span>
    <Select
      {optionIdentifier}
      {labelIdentifier}
      items={Array.from(locationData.values())}
      value={country2}
      on:select={onSelectCountry2}
    />
  </div>
  <div
    class="country-icon"
    style={`background:${
      countryColorScale ? countryColorScale(country2?.id ?? 0) : "white"
    }`}
  />
</div>
<!-- <Example locationMap={locationData}/> -->
<div id="container">
  <div id="content">
    <LineChart
      {bilateralData}
      country1={country1?.id ?? 0}
      country2={country2?.id ?? 0}
      {productData}
      {locationData}
    />

    <BarChart {country1} {country2} {bilateralData} {countryColorScale} />
  </div>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&family=Roboto+Slab:wght@300;400;700&display=swap");
  div,
  p,
  text {
    font-family: "Roboto Slab", serif;
  }
  .heading {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 30px;
  }
  h1 {
    font-size: 3rem;
    margin: 0;
    padding: 0;
  }
  h2 {
    font-weight: 300;
  }
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
    border: 2px solid rgba(0, 0, 0, 0.2);
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
  .dropdown span {
    display: block;
    font-size: 20px;
    font-weight: bold;
    padding: 5px;
  }
  .country-icon {
    margin-top: 10px;
    width: 50px;
    height: 65px;
    border: 2px solid rgba(0, 0, 0, 0.2);
  }
</style>
