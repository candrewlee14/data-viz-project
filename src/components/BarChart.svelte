<script lang="ts">
  import * as d3 from "d3";
  import { flip } from "svelte/animate";
  import { fade } from "svelte/transition";
  import { sectors, showExport, years } from "../global/store";
  import { BilateralTradeYear, Location, Product } from "../models/models";
  import { country1Color, country2Color } from "../global/color";

  export let data: {
    productData: Map<number, Product>;
    locationData: Map<number, Location>;
    bilateralData: Map<number, Map<number, Map<number, BilateralTradeYear[]>>>;
    productColorScale: d3.ScaleOrdinal<string, string, never> | null;
    // countryColorScale: d3.ScaleOrdinal<number, string, never>;
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
    // countryColorScale,
    country1,
    country2,
    loadingDrilldown,
    productData,
    locationData,
  } = data;
  $: ({
    bilateralData,
    productColorScale,
    // countryColorScale,
    country1,
    country2,
    loadingDrilldown,
    productData,
    locationData,
  } = data);

  let width = 800;
  let height = 550;
  let axisElem: SVGGElement;

  const LABEL_HEIGHT = 40;
  const ROW_HEIGHT = 30;
  const MARGIN_X = 0;
  const MARGIN_RIGHT = 10;
  const MARGIN_TOP = 30;
  const PRODUCT_WIDTH = 100;
  const ROW_SPACE = 4;

  const TOOLTIP_OFFSET = 10;
  const TOOLTIP_RECT_WIDTH_BASE = 140;
  const TOOLTIP_RECT_WIDTH_INCRE = 25;
  const TOOLTIP_RECT_HEIGHT = 105;
  const TEXT_OFFSET_X = 20;
  const TEXT_OFFSET_Y_BASE = 35;
  const TEXT_OFFSET_Y_INCRE = 22;

  const formatter = (val: number) => d3.format("$.3s")(val).replace(/G/, "B");

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

  $: sumExport = d3.sum(
    innerDataAll,
    (v: BilateralTradeYear) => v.export_value
  ) as number;

  $: sumImport = d3.sum(
    innerDataAll,
    (v: BilateralTradeYear) => v.import_value
  ) as number;

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

  function getTooltipX(
    eventX: number,
    offsetX: number,
    tooltipWidth: number
  ): number {
    if (eventX + tooltipWidth < width) {
      return eventX + offsetX;
    } else {
      return eventX + offsetX - tooltipWidth;
    }
  }

  function getTooltipY(eventY: number, offsetY: number): number {
    if (eventY + TOOLTIP_RECT_HEIGHT < height) {
      return eventY + offsetY;
    } else {
      return eventY + offsetY - TOOLTIP_RECT_HEIGHT;
    }
  }

  function mouseOver(
    bt: BilateralTradeYear,
    isExport: boolean
  ): (e: any) => void {
    return (e: any) => {
      let tooltip = d3.select("#bar-chart-tooltip");
      let tooltipWidth =
        TOOLTIP_RECT_WIDTH_BASE + $years.length * TOOLTIP_RECT_WIDTH_INCRE;

      tooltip
        .append("rect")
        .attr("id", "tooltip-rect")
        .attr("width", tooltipWidth)
        .attr("height", TOOLTIP_RECT_HEIGHT)
        .attr("x", getTooltipX(e.layerX, TOOLTIP_OFFSET, tooltipWidth))
        .attr("y", getTooltipY(e.layerY, TOOLTIP_OFFSET));

      tooltip
        .append("text")
        .attr("class", "title")
        .attr("id", "tooltip-text1")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr("y", getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE))
        .style("fill", isExport ? country1Color : country2Color)
        .text(`${bt.product.name}`);

      tooltip
        .append("text")
        .attr("id", "tooltip-text2")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + TEXT_OFFSET_Y_INCRE)
        )
        .text(
          (isExport ? "Export: " : "Import: ") +
            `${formatter(isExport ? bt.export_value : bt.import_value)}`
        );

      tooltip
        .append("text")
        .attr("id", "tooltip-text3")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 2 * TEXT_OFFSET_Y_INCRE)
        )
        .text(
          `Share: ${d3.format(".2%")(
            isExport ? bt.export_value / sumExport : bt.import_value / sumImport
          )}`
        );

      tooltip
        .append("text")
        .attr("id", "tooltip-text4")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 3 * TEXT_OFFSET_Y_INCRE)
        )
        .text(
          ($years.length > 1 ? "Years: " : "Year: ") + `${$years.join(", ")}`
        );
    };
  }

  function mouseMove(): (e: any) => void {
    return (e: any) => {
      let tooltipWidth =
        TOOLTIP_RECT_WIDTH_BASE + $years.length * TOOLTIP_RECT_WIDTH_INCRE;
      d3.select("#tooltip-rect")
        .attr("x", getTooltipX(e.layerX, TOOLTIP_OFFSET, tooltipWidth))
        .attr("y", getTooltipY(e.layerY, TOOLTIP_OFFSET));
      d3.select("#tooltip-text1")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr("y", getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE));
      d3.select("#tooltip-text2")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + TEXT_OFFSET_Y_INCRE)
        );
      d3.select("#tooltip-text3")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 2 * TEXT_OFFSET_Y_INCRE)
        );
      d3.select("#tooltip-text4")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 3 * TEXT_OFFSET_Y_INCRE)
        );
    };
  }

  function mouseLeave(): (e: any) => void {
    return (e: any) => {
      d3.select("#bar-chart-tooltip").selectAll("rect").remove();
      d3.select("#bar-chart-tooltip").selectAll("text").remove();
    };
  }
</script>

<div
  id="bar-chart"
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="viz-section"
>
  <svg
    height={Math.max(
      height,
      ((tradeData?.length ?? 0) + 1) * ROW_HEIGHT + MARGIN_TOP
    )}
  >
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
        x={(width - PRODUCT_WIDTH) / 2 + PRODUCT_WIDTH - 20}
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
        Trade Flow {$years.length > 1
          ? `from ${$years[0]} to ${$years[$years.length - 1]}`
          : `in ${$years}`}
        {sortMethod == SortMethod.Up
          ? "↑"
          : sortMethod == SortMethod.Down
          ? "↓"
          : " "}
      </text>
      <text
        class="from-label sortable"
        x={PRODUCT_WIDTH}
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
        Export to {country2?.name + " "}{sortMethod == SortMethod.LeftUp
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
          : " "}&nbsp;Import from {country2?.name}
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
              width={$sectors.size > 0 && $sectors.has(bt.product_id)
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
              fill={country1Color}
              on:focus
              on:keydown={() => {}}
              on:mouseover={mouseOver(bt, true)}
              on:mousemove={mouseMove()}
              on:mouseleave={mouseLeave()}
              on:click={() => {
                if (!$showExport) {
                  showExport.set(true);
                  sectors.update((s) => {
                    s.clear();
                    return s;
                  });
                }
                if ($sectors.has(bt?.product_id)) {
                  sectors.update((s) => {
                    s.delete(bt?.product_id ?? -1);
                    // console.log(s);
                    return s;
                  });
                } else if (bt?.product_id >= 0) {
                  sectors.update((s) => {
                    s.add(bt?.product_id ?? -1);
                    // console.log(s);
                    return s;
                  });
                }
              }}
            />
            <rect
              class="country2-bar"
              x={barScale(0)}
              y={ROW_SPACE / 2}
              height={ROW_HEIGHT - ROW_SPACE}
              width={barScale(bt.import_value) - barScale(0)}
              fill={country2Color}
              on:focus
              on:keydown={() => {}}
              on:mouseover={mouseOver(bt, false)}
              on:mousemove={mouseMove()}
              on:mouseleave={mouseLeave()}
              on:click={() => {
                if ($showExport) {
                  showExport.set(false);
                  sectors.update((s) => {
                    s.clear();
                    return s;
                  });
                }
                if ($sectors.has(bt?.product_id)) {
                  sectors.update((s) => {
                    s.delete(bt?.product_id ?? -1);
                    // console.log(s);
                    return s;
                  });
                } else if (bt?.product_id >= 0) {
                  sectors.update((s) => {
                    s.add(bt?.product_id ?? -1);
                    // console.log(s);
                    return s;
                  });
                }
              }}
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
      <g id="bar-chart-tooltip" class="tooltip" />
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
    margin: 0;
  }

  rect {
    transition: all 0.4s ease;
    outline: none;
  }
  .country1-bar, .country2-bar {
    cursor: pointer;
  }
  .tab {
    transition: all 0.1s ease;
  }
  .sortable {
    cursor: pointer;
  }
  .product-text {
    cursor: pointer;
    transition: fill 0.1s ease-in-out;
  }
  .product-text:hover {
    fill:rgb(96, 96, 96);
  }
  .sortable:hover {
    fill: rgb(121, 122, 134);
    transition: fill 0.05s ease;
  }
</style>
