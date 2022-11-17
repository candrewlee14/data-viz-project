<script lang="ts">
  import * as d3 from "d3";
  import { Location, Product, BilateralTradeYear } from "../models/models";
  import { onMount } from "svelte";
  import { format, select } from "d3";
  import {years} from '../stores/store';
  import { fade, fly } from "svelte/transition";

  export let data: {
    productData: Map<number, Product>,
    locationData: Map<number, Location>,
    bilateralData: Map<number, Map<number, Map<number, BilateralTradeYear[]>>>;
    productColorScale: d3.ScaleOrdinal<string, string, never> | null;
    countryColorScale: d3.ScaleOrdinal<number, string, never>;
    country1: Location | null;
    country2: Location | null;
    loadingDrilldown: boolean;
  };

  let {bilateralData, productColorScale, countryColorScale, country1, country2, loadingDrilldown, productData, locationData} = data;
  $: ({bilateralData, productColorScale, countryColorScale, country1, country2, loadingDrilldown, productData, locationData} = data);

  let width = 800;
  let height = 500;
  let axisElem: SVGGElement;

  const LABEL_HEIGHT = 40;
  const ROW_HEIGHT = 30;
  const MARGIN_X = 0;
  const MARGIN_RIGHT = 10;
  const MARGIN_TOP = 30;
  const PRODUCT_WIDTH = 100;
  const ROW_SPACE = 4;
  const formatter = (val: number) => d3.format("$.2s")(val).replace(/G/, "B");

  $: innerDataByYear = bilateralData?.get(country1?.id ?? 0)
    ?.get(country2?.id ?? 0);

  $: allInnerDataUnagg = ($years.map((year) => innerDataByYear?.get(year) ?? new Array()).flat() as BilateralTradeYear[]);

  $: innerDataAll = Array.from(d3.rollup(allInnerDataUnagg,
    (v) => v.reduce(
            (acc, b) => {
              acc.export_value += b.export_value;
              acc.import_value += b.import_value;
              return acc;
            },
            new BilateralTradeYear(locationData, productData, {
              location_id: country1?.id ?? 0,
              partner_id: country2?.id ?? 0,
              product_id: v[0].product_id,
              year: 0,
              export_value: 0,
              import_value: 0,
            })),
    (d) => d.product_id,
  ).values());

  $: tradeData = innerDataAll.filter((v) => v.product.level == "section");

  // @ts-ignore
  $: maxExport = d3.max(
    innerDataAll,
    (v: BilateralTradeYear) => v.export_value
  ) as number;

  $: maxImport = d3.max(
    innerDataAll,
    (v: BilateralTradeYear) => v.import_value
  ) as number;

  $: maxOverall = Math.max(maxExport, maxImport);

  $: barScale = d3
    .scaleLinear()
    .domain([-maxExport, maxImport])
    .range([PRODUCT_WIDTH + MARGIN_X, width - MARGIN_X - MARGIN_RIGHT]);

  $: {
    let axis = d3
      .axisBottom(barScale)
      .tickFormat((v) => formatter(Math.abs(v as number)));
    d3.select(axisElem).transition().call(axis);
  }
</script>

<div
  id="bar-chart"
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="viz-section"
>
  <svg>
    {#if tradeData && tradeData.length > 0}
      <text
        text-anchor="start"
        class="chart-header"
        x={15}
        y={LABEL_HEIGHT / 2}
        alignment-baseline="hanging"
      >
        Sector
      </text>
      <text
        text-anchor="middle"
        class="chart-header"
        x={(width - PRODUCT_WIDTH) / 2 + PRODUCT_WIDTH}
        y={LABEL_HEIGHT / 2 - 7}
        alignment-baseline="hanging"
      >
        Trade Flow
      </text>
      <text
        class="from-label"
        x={PRODUCT_WIDTH + 20}
        y={LABEL_HEIGHT / 2 - 5}
        alignment-baseline="hanging"
        font-size="13"
      >
        From {country1?.name}
      </text>
      <text
        class="from-label"
        x={width - 20}
        y={LABEL_HEIGHT / 2 - 5}
        text-anchor="end"
        alignment-baseline="hanging"
        font-size="13"
      >
        From {country2?.name}
      </text>
      <g id="bar-content" transform={`translate(${0},${LABEL_HEIGHT})`}>
        {#each tradeData as bt, i (bt.product.name)}
          <g>
            <rect
              x="0"
              y={i * ROW_HEIGHT + MARGIN_TOP + 2}
              height={ROW_HEIGHT - 4}
              width="6"
              fill={productColorScale
                ? productColorScale(bt.product.name)
                : "white"}
            />
            {#if i % 2 == 0}
              <rect
                x="0"
                y={i * ROW_HEIGHT + MARGIN_TOP}
                height={ROW_HEIGHT}
                {width}
                fill="rgba(0,0,0,0.04)"
              />
            {/if}
            <text
              class="product-text"
              alignment-baseline="hanging"
              x={10}
              y={i * ROW_HEIGHT + MARGIN_TOP + 5}>{bt.product.name}</text
            >
            <rect
              class="country1-bar"
              x={barScale(-bt.export_value)}
              y={i * ROW_HEIGHT + MARGIN_TOP + ROW_SPACE / 2}
              height={ROW_HEIGHT - ROW_SPACE}
              width={barScale(0) - barScale(-bt.export_value)}
              fill={countryColorScale(bt.location_id)}
            />
            <rect
              class="country2-bar"
              x={barScale(0)}
              y={i * ROW_HEIGHT + MARGIN_TOP + ROW_SPACE / 2}
              height={ROW_HEIGHT - ROW_SPACE}
              width={barScale(bt.import_value) - barScale(0)}
              fill={countryColorScale(bt.partner_id)}
            />
          </g>
        {/each}
        <line
          id="midline"
          transform={`translate(${barScale(0)},0)`}
          y1={20}
          y2={((tradeData?.length ?? 0) + 1) * ROW_HEIGHT}
          stroke="rgba(0,0,0,0.7)"
          stroke-width="1"
        />
        <line
          x1={PRODUCT_WIDTH}
          y1={0}
          x2={PRODUCT_WIDTH}
          y2={((tradeData?.length ?? 0) + 1) * ROW_HEIGHT}
          stroke="rgba(0,0,0,0.1)"
          stroke-width="1"
        />
        <g id="axis" bind:this={axisElem} />
      </g>
    {:else}
      <text
        in:fade
        x={width / 2}
        y={height / 2}
        alignment-baseline="central"
        text-anchor="middle">No valid data for this pair.</text
      >
    {/if}
    {#if loadingDrilldown}
      <rect x=0 y=0 width={width} height={height} fill="rgba(255,255,255,0.9)"/>
      <text x={width/2} y={height/2} alignment-baseline="central" text-anchor="middle">Loading...</text>
    {/if}
  </svg>
</div>

<style>
  #bar-chart {
    overflow-y: scroll;
  }
  #midline {
    transition: transform 0.4s ease;
  }
  svg {
    width: 100%;
    height: 100%;
    margin: 0;
  }
  :global(.chart-header) {
    font-size: 18px;
    font-weight: bold;
  }
  rect {
    transition: all 0.4s ease;
  }
</style>
