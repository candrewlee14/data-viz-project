<script lang="ts">
  import * as d3 from "d3";
  import { years } from "../global/store";
  import {getFlagUrl} from "../global/flag";
  import { Location, Product, BilateralTradeYear } from "../models/models";
  import { onMount } from "svelte";
  import Select from "svelte-select";
  import Example from "../components/Example.svelte";
  import LineChart from "../components/LineChart.svelte";
  import BarChart from "../components/BarChart.svelte";
  import Range from "../components/Range.svelte";
  import TreeMap from "../components/TreeMap.svelte";
  import { browser } from "$app/environment";
  import { base } from "$app/paths";

  const optionIdentifier = "id";
  const labelIdentifier = "name";
  // 231 is USA
  const USA_ID = 231;
  // 43 is China
  const CHINA_ID = 43;

  $: country1 = locationData?.get(USA_ID) ?? null;
  $: country2 = locationData?.get(CHINA_ID) ?? null;

  const onSelectCountry1 = (e: any) => {
    let l = e.detail as Location;
    country1 = locationData!.get(l.id)!;
  };
  const onSelectCountry2 = (e: any) => {
    let l = e.detail as Location;
    country2 = locationData!.get(l.id)!;
  };

  let allTrades: BilateralTradeYear[] | null;

  let countryColorScale: d3.ScaleOrdinal<number, string, never>;

  let productColorScale: d3.ScaleOrdinal<string, string, never>;

  let locationData: Map<number, Location> = new Map();

  let productData: Map<number, Product> = new Map();
  // maps reporting country to partner country by year then list of trades
  let bilateralData: Map<
    number,
    Map<number, Map<number, BilateralTradeYear[]>>
  >;
  let exportExtent: [number, number];

  // $: bilateralDataForYear = bilateralData?.get($year) ?? new Map();

  // reduce bilateralData

  // $: bilateralDataForYear = d3.rollup(allTrades?.filter((d) => $years.includes(d.year))
  //   (d) => 
  // );

  // maps by partner id then by year
  let drilldownBilateralForCountry: Map<
    number,
    Map<number, BilateralTradeYear[]>
  > | null;
  let loadingDrilldown: boolean = false;

  $: if (browser) {
    drilldownBilateralForCountry = null;
    loadingDrilldown = true;
    d3.csv(
      `${base}/data/${country1?.code ?? "USA"}/${
        country1?.code ?? "USA"
      }_hs2_2010_to_2020.csv`
    ).then((b) => {
      drilldownBilateralForCountry = d3.group(
        b.map((v) => new BilateralTradeYear(locationData, productData, v)),
        (v) => v.partner_id,
        (v) => v.year
      );
      loadingDrilldown = false;
    });
  }

  onMount(async () => {
    Promise.all([
      d3.csv(`${base}/data/location.csv`),
      d3.csv(`${base}/data/hs_product.csv`),
      d3.csv(`${base}/data/hs_2010_to_2020.csv`),
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
      let bls = b.map(
        (v) => new BilateralTradeYear(locationData, productData, v)
      );

      bilateralData = d3.group(
        bls,
        (v) => v.location_id,
        (v) => v.partner_id,
        (v) => v.year,
      );

      allTrades = bls;
      // @ts-ignore
      exportExtent = d3.extent(b, (v) => +v["export_value"]!);

      countryColorScale = d3.scaleOrdinal(
        locationData.keys(),
        d3.schemeTableau10
      );

      productColorScale = d3.scaleOrdinal(
        Array.from(productData)
          .map(([id, p]) => p.level)
          .filter((pl) => pl == "section"),
        d3.schemeTableau10
      );
    });
  });

</script>

<svelte:head>
  <link rel="icon" href={`${base}/favicon.png`} />
</svelte:head>

<div class="heading">
  <h1>Commerce Among Nations</h1>
  <h2>A Bilateral Trade Data Visualization by Andrew Lee & Franklin Yuan</h2>
</div>
{#if locationData && bilateralData && productData && countryColorScale}
  <div class="selectors">
    <img class="country-icon"
      src={getFlagUrl(country1?.code ?? "ATA")}
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
    <img class="country-icon"
      src={getFlagUrl(country2?.code ?? "ATA")}
    />
  </div>
  <div>
    <!-- <Range on:change={(e) => (year = e.detail.value)} /> -->
  </div>
  <!-- <Example locationMap={locationData}/> -->
  <div id="container">
    <div id="content">
      <div class="viz-row">
        <LineChart
          data={{
            bilateralData,
            country1_id: country1?.id ?? 0,
            country2_id: country2?.id ?? 0,
            productData,
            locationData,
            countryColorScale,
          }}
        />
        <BarChart
          data={{
            productData,
            locationData,
            bilateralData,
            loadingDrilldown,
            productColorScale,
            country1,
            country2,
            countryColorScale,
          }}
        />
      </div>
      <div class="viz-row">
        <TreeMap
          data={{
            locationData,
            productData,
            productColorScale,
            country1,
            country2,
            drilldownBilateral: drilldownBilateralForCountry,
            loadingDrilldown,
            valueField: "export_value",
          }}
        />
        <TreeMap
          data={{
            locationData,
            productData,
            productColorScale,
            country1,
            country2,
            drilldownBilateral: drilldownBilateralForCountry,
            loadingDrilldown,
            valueField: "import_value",
          }}
        />
      </div>
    </div>
  </div>
{:else}
  <div class="loading">
    <h3>Loading data...</h3>
    <svg class="spinner" viewBox="0 0 50 50">
      <circle
        class="path"
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke-width="5"
      />
    </svg>
  </div>
{/if}

<style lang="scss">
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
  .viz-row {
    display: flex;
    flex-direction: row;
  }
  #content {
    display: flex;
    flex-direction: column;
    // justify-content: center;
    // max-width: 1700px;
  }
  :global(.viz-section) {
    width: 800px;
    height: 40vh;
    border: 2px solid rgba(0, 0, 0, 0.2);
    margin: 20px;
    padding: 0;
  }
  :global(.viz-section-full) {
    width: 1640px;
    height: 80vh;
    border: 2px solid rgba(0, 0, 0, 0.2);
    margin: 20px;
    padding: 0;
    grid-column-start: 0;
    grid-column-end: 2;
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
    width: 80px;
    height: 60px;
    border: 2px solid rgba(0, 0, 0, 0.2);
  }
  .loading {
    margin-top: 100px;
    font-size: 20px;
    font-weight: bold;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }

  .spinner {
    animation: rotate 2s linear infinite;
    z-index: 2;
    position: absolute;
    top: 50%;
    left: 50%;
    margin: -70px 0 0 -70px;
    width: 140px;
    height: 140px;

    & .path {
      stroke: hsl(210deg, 70%, 75%);
      stroke-linecap: round;
      animation: dash 1.5s ease-in-out infinite;
    }
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }
</style>
