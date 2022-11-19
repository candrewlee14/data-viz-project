<script lang="ts">
  import * as d3 from "d3";
  import { sectors } from "../stores/store";
  import { Location, Product, BilateralTradeYear } from "../models/models";
  import { onMount } from "svelte";
  import { years } from "../stores/store";
  import { fade, fly } from "svelte/transition";
  import { flip } from "svelte/animate";

  export let data: {
    productData: Map<number, Product>;
    locationData: Map<number, Location>;
    bilateralData: Map<number, Map<number, Map<number, BilateralTradeYear[]>>>;
    productColorScale: d3.ScaleOrdinal<string, string, never> | null;
    countryColorScale: d3.ScaleOrdinal<number, string, never>;
    country1: Location | null;
    country2: Location | null;
    loadingDrilldown: boolean;
  };

  enum SortMethod {
    LeftUp,
    LeftDown,
    RightUp,
    RightDown,
    Up,
    Down,
    AlphaUp,
    AlphaDown,
  }

  let sortMethod = SortMethod.AlphaDown;

  let {
    bilateralData,
    productColorScale,
    countryColorScale,
    country1,
    country2,
    loadingDrilldown,
    productData,
    locationData,
  } = data;
  $: ({
    bilateralData,
    productColorScale,
    countryColorScale,
    country1,
    country2,
    loadingDrilldown,
    productData,
    locationData,
  } = data);

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

  $: innerDataByYear = bilateralData
    ?.get(country1?.id ?? 0)
    ?.get(country2?.id ?? 0);

  $: allInnerDataUnagg = $years
    .map((year) => innerDataByYear?.get(year) ?? new Array())
    .flat() as BilateralTradeYear[];

  $: innerDataAll = Array.from(
    d3
      .rollup(
        allInnerDataUnagg,
        (v) =>
          v.reduce(
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
            })
          ),
        (d) => d.product_id
      )
      .values()
  );

  $: tradeDataUnsorted = innerDataAll.filter(
    (v) => v.product.level == "section"
  );

  $: tradeData = tradeDataUnsorted.sort((a, b) => {
    switch (sortMethod) {
      case SortMethod.LeftUp:
        return a.export_value - b.export_value;
      case SortMethod.LeftDown:
        return b.export_value - a.export_value;
      case SortMethod.RightUp:
        return a.import_value - b.import_value;
      case SortMethod.RightDown:
        return b.import_value - a.import_value;
      case SortMethod.Up:
        return (
          a.import_value + a.export_value - (b.import_value + b.export_value)
        );
      case SortMethod.Down:
        return (
          b.import_value + b.export_value - (a.import_value + a.export_value)
        );
      case SortMethod.AlphaDown:
        return a.product.name.localeCompare(b.product.name);
      case SortMethod.AlphaUp:
        return b.product.name.localeCompare(a.product.name);
      default:
        return 0;
    }
  });
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
        class="chart-header sortable"
        x={15}
        y={LABEL_HEIGHT / 2}
        alignment-baseline="hanging"
        on:click={() => {
          if (sortMethod == SortMethod.AlphaDown) {
            sortMethod = SortMethod.AlphaUp;
          } else {
            sortMethod = SortMethod.AlphaDown;
          }
        }}
        on:keydown={() => {}}
      >
        Sector {sortMethod == SortMethod.AlphaUp
          ? "↑"
          : sortMethod == SortMethod.AlphaDown
          ? "↓"
          : " "}
      </text>
      <text
        text-anchor="middle"
        class="chart-header sortable"
        x={(width - PRODUCT_WIDTH) / 2 + PRODUCT_WIDTH}
        y={LABEL_HEIGHT / 2 - 7}
        alignment-baseline="hanging"
        on:click={() => {
          if (sortMethod == SortMethod.Down) {
            sortMethod = SortMethod.Up;
          } else {
            sortMethod = SortMethod.Down;
          }
        }}
        on:keydown={() => {}}
      >
        Trade Flow {sortMethod == SortMethod.Up
          ? "↑"
          : sortMethod == SortMethod.Down
          ? "↓"
          : " "}
      </text>
      <text
        class="from-label sortable"
        x={PRODUCT_WIDTH + 20}
        y={LABEL_HEIGHT / 2 - 5}
        alignment-baseline="hanging"
        font-size="13"
        on:keydown={() => {}}
        on:click={() => {
          if (sortMethod == SortMethod.LeftDown) {
            sortMethod = SortMethod.LeftUp;
          } else {
            sortMethod = SortMethod.LeftDown;
          }
        }}
      >
        From {country1?.name + " "}{sortMethod == SortMethod.LeftUp
          ? "↑"
          : sortMethod == SortMethod.LeftDown
          ? "↓"
          : " "}
      </text>
      <text
        class="from-label sortable"
        x={width - 20}
        y={LABEL_HEIGHT / 2 - 5}
        text-anchor="end"
        alignment-baseline="hanging"
        font-size="13"
        on:click={() => {
          if (sortMethod == SortMethod.RightDown) {
            sortMethod = SortMethod.RightUp;
          } else {
            sortMethod = SortMethod.RightDown;
          }
        }}
        on:keydown={() => {}}
      >
        {sortMethod == SortMethod.RightUp
          ? "↑"
          : sortMethod == SortMethod.RightDown
          ? "↓"
          : " "}&nbsp;From {country2?.name}
      </text>
      <g id="bar-content" transform={`translate(${0},${LABEL_HEIGHT})`}>
        {#each tradeData as bt, i (bt.product_id)}
          {#if i % 2 == 0}
            <rect
              x="0"
              y={i * ROW_HEIGHT + MARGIN_TOP}
              height={ROW_HEIGHT}
              {width}
              fill="rgba(0,0,0,0.04)"
            />
          {/if}
        {/each}
        {#each tradeData as bt, i (i)}
          <g
            class="bar-row"
            transform={`translate(0, ${i * ROW_HEIGHT + MARGIN_TOP})`}
          >
            <rect
              class="tab"
              x="0"
              y="2"
              height={ROW_HEIGHT - 4}
              width={($sectors.size > 0 && $sectors.has(bt.product_id))
                ? PRODUCT_WIDTH - 1
                : 6}
              fill={productColorScale
                ? productColorScale(bt.product.name)
                : "white"}
            />

            <rect
              class="country1-bar"
              x={barScale(-bt.export_value)}
              y={ROW_SPACE / 2}
              height={ROW_HEIGHT - ROW_SPACE}
              width={barScale(0) - barScale(-bt.export_value)}
              fill={countryColorScale(bt.location_id)}
            />
            <rect
              class="country2-bar"
              x={barScale(0)}
              y={ROW_SPACE / 2}
              height={ROW_HEIGHT - ROW_SPACE}
              width={barScale(bt.import_value) - barScale(0)}
              fill={countryColorScale(bt.partner_id)}
            />
          </g>
        {/each}
        {#each tradeData as bt, i (bt.product_id)}
          <text
            class="product-text"
            alignment-baseline="hanging"
            x="10"
            y={i * ROW_HEIGHT + MARGIN_TOP + 6}
            on:click={() => {
              if ($sectors.has(bt.product_id)) {
                sectors.update((s) => {
                  s.delete(bt.product_id);
                  return s;
                });
              } else {
                sectors.update((s) => {
                  s.add(bt.product_id);
                  return s;
                });
              }
            }}
            on:keydown={() => {}}
            animate:flip={{ duration: 400, delay: 20 }}>{bt.product.name}</text
          >
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
      <rect x="0" y="0" {width} {height} fill="rgba(255,255,255,0.9)" />
      <text
        x={width / 2}
        y={height / 2}
        alignment-baseline="central"
        text-anchor="middle">Loading...</text
      >
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
  .tab {
    transition: all 0.1s ease;
  }
  .sortable {
    cursor: pointer;
  }
  .product-text {
    cursor: pointer;
  }
  .sortable:hover {
    fill: rgb(121, 122, 134);
    transition: fill 0.05s ease;
  }
</style>
