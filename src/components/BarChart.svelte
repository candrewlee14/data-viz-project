<script lang="ts">
  import * as d3 from "d3";
  import type { Location, Product, BilateralTradeYear } from "../models/models";
  import { onMount } from "svelte";
  import { format, select } from "d3";
  export let bilateralData: Map<number, Map<number, BilateralTradeYear[]>>;
  // export let locationData: Map<number, Location>;
  // export let productData: Map<number, Product>;
  export let countryColorScale: d3.ScaleOrdinal<number, string, never>;
  export let country1: number;
  export let country2: number;

  let width = 800;
  let height = 500;
  let axisElem: SVGGElement;

  const ROW_HEIGHT = 30;
  const MARGIN_X = 0;
  const MARGIN_TOP = 30;
  const LABEL_WIDTH = 100;
  const ROW_SPACE = 4;
  const formatter = d3.format("$.4s");

  $: tradeData = bilateralData
    .get(country1)
    ?.get(country2)
    ?.filter((v) => v.product.level == "section");

  // @ts-ignore
  $: maxExport = d3.max(
    bilateralData.get(country1)?.get(country2) ?? new Array(),
    (v: BilateralTradeYear) => v.export_value
  ) as number;

  $: maxImport = d3.max(
    bilateralData.get(country1)?.get(country2) ?? new Array(),
    (v: BilateralTradeYear) => v.import_value
  ) as number;

  $: maxOverall = Math.max(maxExport, maxImport);

  $: barScale = d3
    .scaleLinear()
    .domain([-maxExport, maxImport])
    .range([LABEL_WIDTH + MARGIN_X, width - MARGIN_X]);

  $: {
    let axis = d3
      .axisBottom(barScale)
      .tickFormat((v) => formatter(Math.abs(v as number)));
    d3.select(axisElem).call(axis);
  }
</script>

<div
  id="bar-chart"
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="viz-section"
>
  <svg>
    {#if tradeData}
      {#each tradeData as bt, i (bt.product.name)}
        <g>
          {#if i % 2 == 0}
            <rect
            x=0
            y={i * ROW_HEIGHT + MARGIN_TOP}
            height={ROW_HEIGHT}
            width={width}
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
            x={barScale(-bt.export_value)}
            y={i * ROW_HEIGHT + MARGIN_TOP + ROW_SPACE/2}
            height={ROW_HEIGHT - ROW_SPACE}
            width={barScale(0) - barScale(-bt.export_value)}
            fill={countryColorScale(bt.location_id)}
          />
          <rect
            x={barScale(0)}
            y={i * ROW_HEIGHT + MARGIN_TOP + ROW_SPACE/2}
            height={ROW_HEIGHT - ROW_SPACE}
            width={barScale(bt.import_value) - barScale(0)}
            fill={countryColorScale(bt.partner_id)}
          />
        </g>
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
      <line
        x1={barScale(0)}
        y1={0}
        x2={barScale(0)}
        y2={(tradeData?.length + 1 ?? 0) * ROW_HEIGHT}
        stroke="rgba(0,0,0,0.7)"
        stroke-width="1"
      />
      <line
      x1={LABEL_WIDTH}
      y1={0}
      x2={LABEL_WIDTH}
      y2={(tradeData?.length + 1 ?? 0) * ROW_HEIGHT}
      stroke="rgba(0,0,0,0.1)"
      stroke-width="1"
    />
      <g id="axis" bind:this={axisElem} />
    {:else}
      <text transform={`translate(${width / 2},${height / 2})`}
        >Loading data...</text
      >
    {/if}
  </svg>
</div>

<style>
  #bar-chart {
    overflow-y: scroll;
  }
  svg {
    width: 100%;
    height: 100%;
    margin: 0;
  }
</style>
