<script lang="ts">
  import { browser } from "$app/environment";
  import { base } from "$app/paths";
  import * as d3 from "d3";
  import { onMount } from "svelte";
  import Select from "svelte-select";
  import { fade } from "svelte/transition";
  import BarChart from "../components/BarChart.svelte";
  import LineChart from "../components/LineChart.svelte";
  import TreeMap from "../components/TreeMap.svelte";
  import { getFlagUrl } from "../global/flag";
  import { sectors, years, showExport } from "../global/store";
  import { BilateralTradeYear, Location, Product } from "../models/models";
  import * as feather from "feather-icons";
  import { country1Color, country2Color } from "../global/color";

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

  // let countryColorScale: d3.ScaleOrdinal<number, string, never>;

  let productColorScale: d3.ScaleOrdinal<string, string, never>;

  let locationData: Map<number, Location> = new Map();

  let productData: Map<number, Product> = new Map();
  // maps reporting country to partner country by year then list of trades
  let bilateralData: Map<
    number,
    Map<number, Map<number, BilateralTradeYear[]>>
  >;
  let exportExtent: [number, number];

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

  function switchCountries() {
    let tempCountry = country1;
    country1 = country2;
    country2 = tempCountry;
  }

  function switchToShowingExport() {
    $showExport = true;
  }

  function switchToShowingImport() {
    $showExport = false;
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
        (v) => v.year
      );

      allTrades = bls;
      // @ts-ignore
      exportExtent = d3.extent(b, (v) => +v["export_value"]!);

      // countryColorScale = d3.scaleOrdinal(
      //   locationData.keys(),
      //   d3.schemeTableau10
      // );

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
  <title>Commerce Among Nations</title>
</svelte:head>

<div class="outer">
  <div class="nav">
    <a href={base + "/processbook"} title="process-book">
      {@html feather.icons["book-open"].toSvg()}
    </a>
    <a
      href="https://youtu.be/SW7_N_GHnCE"
      title="screencast"
      target="_blank"
      rel="noreferrer"
    >
      {@html feather.icons.youtube.toSvg()}
    </a>
    <a
      href="https://dataverse.harvard.edu/dataverse/atlas"
      title="data"
      target="_blank"
      rel="noreferrer"
    >
      {@html feather.icons.database.toSvg()}
    </a>
    <a
      href="https://github.com/candrewlee14/data-viz-project"
      title="github"
      target="_blank"
      rel="noreferrer"
    >
      {@html feather.icons.github.toSvg()}
    </a>
  </div>
  <div class="heading">
    <h1>Commerce Among Nations</h1>
  </div>
  {#if locationData && bilateralData && productData}
    <div class="selectors">
      <img
        class="country-icon"
        alt="Select a country"
        src={getFlagUrl(country1?.code ?? "ATA")}
      />
      <div class="dropdown">
        <div class="country-title">
          <div style={`background-color:${country1Color}`} />
          <span>Country</span>
          <div style={`background-color:${country1Color}`} />
        </div>
        <Select
          {optionIdentifier}
          {labelIdentifier}
          items={Array.from(locationData.values())}
          value={country1}
          on:select={onSelectCountry1}
        />
      </div>
      <div class="switch-btn-container">
        <button class="switch-btn" on:click={switchCountries}>↔</button>
      </div>
      <div class="dropdown">
        <div class="country-title">
          <div style={`background-color:${country2Color}`} />
          <span>Partner</span>
          <div style={`background-color:${country2Color}`} />
        </div>
        <Select
          {optionIdentifier}
          {labelIdentifier}
          items={Array.from(locationData.values())}
          value={country2}
          on:select={onSelectCountry2}
        />
      </div>
      <img
        class="country-icon"
        alt="Select a partner"
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
              // countryColorScale,
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
              // countryColorScale,
            }}
          />
        </div>
        <div class="spacer">
          <div>
            <span>Showing </span>
            <button
              class:btn-active={$showExport}
              class:btn-inactive={!$showExport}
              on:click={switchToShowingExport}>Exports</button
            >
            <button
              class:btn-active={!$showExport}
              class:btn-inactive={$showExport}
              on:click={switchToShowingImport}>Imports</button
            >
          </div>
          <div>
            <h2 class="chart-header">
              What did
              <b>{country1?.name}</b>
              {$showExport ? "export to " : "import from "}
              <b>{country2?.name}</b>
              {$years.length > 1
                ? `from ${$years[0]} to ${$years[$years.length - 1]}?`
                : `in ${$years}?`}
            </h2>
          </div>
          <div class="clear-sectors">
            {#if $sectors.size > 0}
              <button
                height="10"
                in:fade={{ duration: 200 }}
                out:fade={{ duration: 200 }}
                on:click={() => {
                  sectors.set(new Set());
                }}>Clear Sector Selection</button
              >
            {/if}
          </div>
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
            }}
          />
        </div>
      </div>
    </div>
    <footer>
      <center
        >A Bilateral Trade Exloration Tool by <b>Andrew Lee</b> &
        <b>Franklin Yuan</b></center
      >
    </footer>
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
</div>

<style lang="scss">
  @import url("https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&family=Roboto+Slab:wght@300;400;700&display=swap");
  @import url("https://fonts.googleapis.com/css2?family=Source+Serif+Pro:ital,wght@0,300;0,400;0,600;1,600&display=swap");
  @import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600&display=swap');
  :global(div, p, text, button) {
    font-family: "Roboto Slab", serif;
  }
  .country-title {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    div {
      margin: 5px 5px 0 5px;
      height: 6px;
      width: 60px;
    }
  }
  .nav {
    position: absolute;
    width: 99%;
    padding: 0px;
    display: flex;
    flex-direction: row;
    justify-content: end;
    a,
    a:active,
    a:visited {
      margin-top: 25px;
      padding: 7px 13px;
      color: rgb(68, 68, 68);
    }
  }
  :global(.feather) {
    width: 40px;
    height: 40px;
  }
  .outer {
    padding: 0;
    margin: 0;
    width: 100%;
    background-color: #f8f8f8;
    min-height: 100vh;
  }
  .heading {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 15px;
    padding-bottom: 20px;
    margin-bottom: 15px;
    box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.1);
    background-color: rgb(255, 255, 255);
  }
  h1 {
    font-size: 2.5rem;
    margin: 2px;
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
  .clear-sectors {
    height: 10px;
    display: flex;
    flex-direction: row;
    button {
      position: absolute;
    }
  }
  .spacer {
    display: grid;
    margin: 0 20px;
    width: 1640px;
    height: 40px;
    grid-template-columns: 1fr 3fr 1fr;
    justify-items: center;
    align-items: center;
    h2 {
      font-size: 1.3rem;
    }
  }
  button {
    border: 2px solid rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    background-color: #dedede;
  }
  button:hover {
    border: 2px solid rgba(0, 0, 0, 0.5);
    background-color: #b9b9b9;
  }

  footer {
    color: rgb(146, 146, 146);
    padding: 20px 0 40px 0;
  }

  :global(.chart-header) {
    font-size: 18px;
    font-weight: bold;
  }
  :global(.viz-section) {
    width: 800px;
    height: 41vh;
    border: 2px solid rgba(0, 0, 0, 0.2);
    margin: 20px 20px 5px 20px;
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
  :global(.tooltip > rect) {
    fill: #f2f2f2;
    opacity: 0.8;
    // rx: 15px;
    // ry: 15px;
  }

  :global(.axis-header) {
    font-family: "Zilla Slab", serif;
    font-size: 15px;
    font-weight: 600;
  }

  :global(.axis-label) {
    font-size: 13px;
    font-weight: 500;
    fill: black;
  }

  :global(.axis-ticks) {
    font-family: "Zilla Slab", serif;
    font-size: 0.65em;
  }

  :global(.tooltip > text) {
    font-size: 16px;
  }
  :global(.tooltip > text.title) {
    font-size: 20px;
    font-weight: bold;
  }

  :global(.tooltip > text.treemap) {
    font-size: 12px;
  }

  :global(.surplus) {
    fill: "#66c2a5";
  }

  :global(.deficit) {
    fill: "#fc8d62";
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
    background-color: transparent;
  }

  .spinner {
    background-color: transparent;
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

  :global(svg) {
    background-color: rgb(253, 253, 253);
  }

  .switch-btn-container {
    position: relative;
    width: 55px;
  }
  .switch-btn {
    position: absolute;
    width: 50px;
    height: 30px;
    bottom: 5px;
    width: 100%;
  }

  .switch-btn:hover {
    background-color: #a3a3a3;
  }

  .btn-active {
    background-color: #8dd3c7;
  }
  .btn-active:hover {
    background-color: #5faa9d;
  }
  .btn-inactive {
    color: rgb(153, 153, 153);
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
