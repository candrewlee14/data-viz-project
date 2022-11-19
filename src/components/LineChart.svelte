<script lang="ts">
  import * as d3 from "d3";
  import { years, sectors } from "../stores/store";
  import {
    type Location,
    type Product,
    BilateralTradeYear,
  } from "../models/models";
  import type { BrushSelection } from "d3";

  export let data: {
    bilateralData: Map<
      number,
      Map<number, Map<number, BilateralTradeYear[]>>
    > | null;
    locationData: Map<number, Location>;
    productData: Map<number, Product>;
    country1_id: number;
    country2_id: number;
    countryColorScale: d3.ScaleOrdinal<number, string, never>;
  };

  let {
    bilateralData,
    locationData,
    productData,
    country1_id: country1,
    country2_id: country2,
    countryColorScale,
  } = data;
  $: ({
    bilateralData,
    locationData,
    productData,
    country1_id: country1,
    country2_id: country2,
    countryColorScale,
  } = data);

  const MARGIN = 35;
  const MARGIN_TOP = 15;
  const MARGIN_LEFT = 50;

  let width = 800;
  let height = 400;
  const formatter = (val: number) => d3.format("$.2s")(val).replace(/G/, "B");

  let xAxisElem: SVGGElement;
  let yAxisElem: SVGGElement;
  let brushElem: SVGGElement;
  let country1Line: SVGPathElement;
  let country2Line: SVGPathElement;
  let isBrushing: boolean = false;

  $: {
    let brush = d3.brushX().on("start brush end", (e) => {
        if (e?.selection === null || e?.selection[1] - e?.selection[0] < 5) {
          years.set([2020]);
          isBrushing = false;
        } else {
          isBrushing = true;
          let selection = e.selection as BrushSelection;
          const x0 = selection[0] as number;
          const x1 = selection[1] as number;
          let firstYear = Math.ceil(xScale.invert(x0));
          let lastYear = Math.floor(xScale.invert(x1));
          let selYears = [];
          for (let i = firstYear; i <= lastYear; i++) {
            selYears.push(i);
          }
          years.set(selYears);
        }
      });
    d3.select(brushElem).call(brush);
  }
  $: tradeYearTotals = Array.from(
    bilateralData?.get(country1)?.get(country2)?.entries() ?? new Array()
  ).map((d) => {
    // @ts-ignore
    let year: number = d[0];
    // @ts-ignore
    let bls: BilateralTradeYear[] = d[1];
    bls = $sectors.size == 0
          ? bls
          : bls.filter((d) => $sectors.has(d.product_id));
    return bls.reduce(
      (acc, b) => {
        acc.export_value += b.export_value;
        acc.import_value += b.import_value;
        return acc;
      },
      new BilateralTradeYear(locationData, productData, {
        location_id: country1,
        partner_id: country2,
        product_id: 0,
        year: year,
        export_value: 0,
        import_value: 0,
      })
    );
  }).sort((a,b) => a.year - b.year);
 
 $: console.log(tradeYearTotals);

  $: yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(tradeYearTotals, (d) =>
        Math.max(d.export_value, d.import_value)
      ) ?? 0,
    ])
    .range([height - MARGIN, MARGIN + MARGIN_TOP]);

  $: xScale = d3
    .scaleLinear()
    // @ts-ignore
    .domain(d3.extent(tradeYearTotals, (d) => d.year))
    .range([MARGIN_LEFT, width - MARGIN]);

  $: {
    let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    d3.select(xAxisElem).transition().call(xAxis);
    let yAxis = d3.axisLeft(yScale).tickFormat((v) => formatter(v as number));
    d3.select(yAxisElem).transition().call(yAxis);
  }

  $: {
    let ctx = d3.path();
    if (tradeYearTotals.length > 0) {
      tradeYearTotals.sort((b) => b.year);
      ctx.moveTo(
        xScale(tradeYearTotals[0].year),
        yScale(tradeYearTotals[0].export_value)
      );
    }
    tradeYearTotals.forEach((b) => {
      ctx.lineTo(xScale(b.year), yScale(b.export_value));
    });
    d3.select(country1Line).transition().attr("d", ctx.toString());
  }

  $: {
    let ctx = d3.path();
    if (tradeYearTotals.length > 0) {
      ctx.moveTo(
        xScale(tradeYearTotals[0].year),
        yScale(tradeYearTotals[0].import_value)
      );
    }
    tradeYearTotals.forEach((b) => {
      ctx.lineTo(xScale(b.year), yScale(b.import_value));
    });
    d3.select(country2Line).transition().attr("d", ctx.toString());
  }

  function updateYear(aYear: number): () => void {
    return () => years.set([aYear]);
  }
</script>

<div
  id="line-chart"
  class="viz-section"
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  <svg {width} {height}>
    <text class="chart-header" x={width / 2} y={MARGIN - 5} text-anchor="middle"
      >Total Trade Over Time</text
    >
    <g class="brush" bind:this={brushElem} />
    {#if !isBrushing}
      <rect
        class="timebar"
        x={xScale($years[0]) - 12}
        y={35}
        width="24"
        height={height - 35 - MARGIN}
        fill="rgba(0,0,0,0.2)"
      />
    {/if}
    <g
      id="xAxis"
      bind:this={xAxisElem}
      transform={`translate(${0},${height - MARGIN})`}
    />
    <g
      id="yAis"
      bind:this={yAxisElem}
      transform={`translate(${MARGIN_LEFT},${0})`}
    />
    <g class="country1-group country-group">
      <path
        bind:this={country1Line}
        fill="none"
        stroke={countryColorScale(country1)}
        stroke-width="2"
      />
      {#each tradeYearTotals as bt (bt.year)}
        <circle
          class="circ1"
          cx={xScale(bt.year)}
          cy={yScale(bt.export_value)}
          r="5"
          fill={countryColorScale(country1)}
          stroke={$years.includes(bt.year) ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)"}
          stroke-width=2
          on:click={updateYear(bt.year)}
          on:keydown={() => {}}
        />
      {/each}
    </g>
    <g class="country2-group country-group">
      <path
        bind:this={country2Line}
        fill="none"
        stroke={countryColorScale(country2)}
        stroke-width="2"
      />
      {#each tradeYearTotals as bt (bt.year)}
        <circle
          cx={xScale(bt.year)}
          cy={yScale(bt.import_value)}
          r="5"
          fill={countryColorScale(country2)}
          stroke={$years.includes(bt.year) ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)"}
          stroke-width=2
          on:click={updateYear(bt.year)}
          on:keydown={() => {}}
        />
      {/each}
    </g>
  </svg>
  <!-- <p>{formatter(tradeYearTotals.export_value ?? 0)}</p>
  <p>{formatter(tradeYearTotals.import_value ?? 0)}</p>
  <p>Loading data...</p> -->
</div>

<style>
  .country-group circle {
    transition: cx, cy 0.3s ease-in-out;
  }
</style>
