<script lang="ts">
  import * as d3 from "d3";
  import {
    type Location,
    type Product,
    BilateralTradeYear,
  } from "../models/models";
  export let bilateralData: Map<
    number,
    Map<number, Map<number, BilateralTradeYear[]>>
  > | null;
  export let locationData: Map<number, Location>;
  export let productData: Map<number, Product>;
  export let country1: number;
  export let country2: number;
  export let countryColorScale: d3.ScaleOrdinal<number, string, never>;

  const MARGIN = 30;
  const MARGIN_LEFT = 50;

  let width = 800;
  let height = 400;
  const formatter = d3.format("$.2s");

  // let tradeYearTotals: BilateralTradeYear[] = new Array();
  let xAxisElem: SVGGElement;
  let yAxisElem: SVGGElement;
  let country1Line: SVGPathElement;
  let country2Line: SVGPathElement;

  $: tradeYearTotals = Array.from(bilateralData?.entries() ?? new Array())
      .map((data) => {
      // @ts-ignore
      let year : number = data[0];
      // @ts-ignore
      let v : Map<number, Map<number, BilateralTradeYear[]>> = data[1];
      return v
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
              year: year,
              export_value: 0,
              import_value: 0,
            })
          ) ??
          new BilateralTradeYear(locationData, productData, {
            location_id: country1,
            partner_id: country2,
            product_id: 0,
            year: year,
            export_value: 0,
            import_value: 0,
          });
  }).sort((a, b) => a.year - b.year);

  $: yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(tradeYearTotals, (d) =>
        Math.max(d.export_value, d.import_value)
      ) ?? 0,
    ])
    .range([height - MARGIN, MARGIN]);

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
      ctx.moveTo(xScale(tradeYearTotals[0].year), yScale(tradeYearTotals[0].export_value))
    }
    tradeYearTotals.forEach((b) => {
      ctx.lineTo(xScale(b.year), yScale(b.export_value))
    })
    d3.select(country1Line).transition().attr("d", ctx.toString());
  };

  $: {
    let ctx = d3.path();
    if (tradeYearTotals.length > 0) {
      ctx.moveTo(xScale(tradeYearTotals[0].year), yScale(tradeYearTotals[0].import_value))
    }
    tradeYearTotals.forEach((b) => {
      ctx.lineTo(xScale(b.year), yScale(b.import_value))
    })
    d3.select(country2Line).transition().attr("d", ctx.toString());
  };
</script>

<div
  id="line-chart"
  class="viz-section"
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  <svg {width} {height}>
    <g id="xAxis" bind:this={xAxisElem} transform={`translate(${0},${height - MARGIN})`}/>
    <g id="yAis" bind:this={yAxisElem} transform={`translate(${MARGIN_LEFT},${0})`}/>
    <path bind:this={country1Line} fill="none" stroke={countryColorScale(country1)} stroke-width=2/>
    <path bind:this={country2Line} fill="none" stroke={countryColorScale(country2)} stroke-width=2/>
  </svg>
  <!-- <p>{formatter(tradeYearTotals.export_value ?? 0)}</p>
  <p>{formatter(tradeYearTotals.import_value ?? 0)}</p>
  <p>Loading data...</p> -->
</div>

<style>
</style>
