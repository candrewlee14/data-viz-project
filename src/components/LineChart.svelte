<script lang="ts">
  import type { BrushSelection } from "d3";
  import * as d3 from "d3";
  import { sectors, years } from "../global/store";
  import { country1Color, country2Color, deficit, surplus } from "../global/color";

  import { fade } from "svelte/transition";
  import {
    BilateralTradeYear,
    type Location,
    type Product,
  } from "../models/models";
  import { onMount } from "svelte";

  export let data: {
    bilateralData: Map<
      number,
      Map<number, Map<number, BilateralTradeYear[]>>
    > | null;
    locationData: Map<number, Location>;
    productData: Map<number, Product>;
    country1_id: number;
    country2_id: number;
    // countryColorScale: d3.ScaleOrdinal<number, string, never>;
  };

  let {
    bilateralData,
    locationData,
    productData,
    country1_id: country1,
    country2_id: country2,
    // countryColorScale,
  } = data;
  $: ({
    bilateralData,
    locationData,
    productData,
    country1_id: country1,
    country2_id: country2,
    // countryColorScale,
  } = data);

  const MARGIN = 35;
  const MARGIN_TOP = 15;
  const MARGIN_LEFT = 50;
  const MARGIN_RIGHT = 50;

  const BAND_WIDTH = 16;

  const TOOLTIP_OFFSET = 10;
  const TOOLTIP_RECT_WIDTH = 180;
  const TOOLTIP_RECT_HEIGHT_BASE = 68;
  const TOOLTIP_RECT_HEIGHT_INCRE = 22;
  const TEXT_OFFSET_X = 20;
  const TEXT_OFFSET_Y_TITLE = 35;
  const TEXT_OFFSET_Y_BASE = 37;
  const TEXT_OFFSET_Y_INCRE = 22;



  let width = 0;
  let height = 0;
  const formatter = (val: number) => d3.format("$.3s")(val).replace(/G/, "B");
  const moreAccurateFormatter = (val: number) =>
    d3.format("$,~s")(val).replace(/G/, "B");

  let xAxisElem: SVGGElement;
  let y1AxisElem: SVGGElement;
  let y2AxisElem: SVGGElement;
  let brushElem: SVGGElement;
  let country1Line: SVGPathElement;
  let country2Line: SVGPathElement;
  let isBrushing: boolean = false;
  let sectorStrings: Array<string>;

  $: tradeYearGrossValues = Array.from(
    bilateralData?.get(country1)?.get(country2)?.entries() ?? new Array()
  )
    .map((d) => {
      // @ts-ignore
      let year: number = d[0];
      // @ts-ignore
      let bls: BilateralTradeYear[] = d[1];
      bls =
        $sectors.size == 0
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
    })
    .sort((a, b) => a.year - b.year);

  $: tradeYearBySectors = bilateralData?.get(country1)?.get(country2);

  $: xScale = d3
    .scaleLinear()
    // @ts-ignore
    .domain(d3.extent(tradeYearGrossValues, (d) => d.year))
    .range([
      MARGIN_LEFT + BAND_WIDTH / 2,
      width - MARGIN_RIGHT - BAND_WIDTH / 2,
    ]);

  $: yScaleGrossValues = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(tradeYearGrossValues, (d) =>
        Math.max(d.export_value, d.import_value)
      ) ?? 0,
    ])
    .range([height - MARGIN, MARGIN + MARGIN_TOP])
    .nice();

  $: brushFunc = (e: any) => {
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
  };

  $: {
    let brush = d3
      .brushX()
      .extent([
        [MARGIN_LEFT - 1, MARGIN + 10],
        [width - MARGIN_RIGHT + 1, height - MARGIN],
      ])
      .on("start brush end", brushFunc);
    d3.select(brushElem).call(brush);
  }

  $: maxNetValue =
    d3.max(tradeYearGrossValues, (d) => d.export_value - d.import_value) ?? 0;

  $: minNetValue =
    d3.min(tradeYearGrossValues, (d) => d.export_value - d.import_value) ?? 0;

  $: yScaleNetValues = d3
    .scaleLinear()
    .domain([
      d3.min(tradeYearGrossValues, (d) => d.export_value - d.import_value) ?? 0,
      d3.max(tradeYearGrossValues, (d) => d.export_value - d.import_value) ?? 0,
    ])
    .range([height - MARGIN, MARGIN + MARGIN_TOP])
    .nice();

  $: {
    let xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));

    d3.select(xAxisElem)
      .transition()
      .call(xAxis)
      .select(".domain")
      .attr("stroke-width", 0);

    let y1Axis = d3
      .axisLeft(yScaleGrossValues)
      .tickFormat((v) => formatter(v as number));
    d3.select(y1AxisElem).transition().call(y1Axis);
    let y2Axis = d3
      .axisRight(yScaleNetValues)
      .tickFormat((v) => formatter(v as number));
    d3.select(y2AxisElem).transition().call(y2Axis);
  }

  $: {
    let ctx = d3.path();
    if (tradeYearGrossValues.length > 0) {
      tradeYearGrossValues.sort((b) => b.year);
      ctx.moveTo(
        xScale(tradeYearGrossValues[0].year),
        yScaleGrossValues(tradeYearGrossValues[0].export_value)
      );
    }
    tradeYearGrossValues.forEach((b) => {
      ctx.lineTo(xScale(b.year), yScaleGrossValues(b.export_value));
    });
    d3.select(country1Line).transition().attr("d", ctx.toString());
  }

  $: {
    let ctx = d3.path();
    if (tradeYearGrossValues.length > 0) {
      ctx.moveTo(
        xScale(tradeYearGrossValues[0].year),
        yScaleGrossValues(tradeYearGrossValues[0].import_value)
      );
    }
    tradeYearGrossValues.forEach((b) => {
      ctx.lineTo(xScale(b.year), yScaleGrossValues(b.import_value));
    });
    d3.select(country2Line).transition().attr("d", ctx.toString());
  }

  $: sectorStrings =
    $sectors.size == 0
      ? ["All"]
      : Array.from($sectors.values())
          .map((productId) => productData?.get(productId)?.name ?? "something")
          .sort();

  function updateYear(aYear: number): () => void {
    return () => years.set([aYear]);
  }

  function getTooltipX(eventX: number, offsetX: number): number {
    if (eventX + TOOLTIP_RECT_WIDTH < width) {
      return eventX + offsetX;
    } else {
      return eventX + offsetX - TOOLTIP_RECT_WIDTH;
    }
  }

  function getTooltipY(
    eventY: number,
    offsetY: number,
    tooltipHeight: number
  ): number {
    if (eventY + tooltipHeight < height) {
      return eventY + offsetY;
    } else {
      return eventY + offsetY - TOOLTIP_RECT_HEIGHT_BASE;
    }
  }

  function mouseOverCircle(
    bt: BilateralTradeYear,
    isExport: boolean
  ): (e: any) => void {
    return (e: any) => {
      let tooltip = d3.select("#line-chart-tooltip");
      let tooltipHeight =
        TOOLTIP_RECT_HEIGHT_BASE +
        sectorStrings.length * TOOLTIP_RECT_HEIGHT_INCRE;

      tooltip
        .append("rect")
        .attr("width", TOOLTIP_RECT_WIDTH)
        .attr("height", tooltipHeight)
        .attr("x", getTooltipX(e.layerX, TOOLTIP_OFFSET))
        .attr("y", getTooltipY(e.layerY, TOOLTIP_OFFSET, tooltipHeight));

      tooltip
        .append("text")
        .attr("class", "title")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
        .attr("y", getTooltipY(e.layerY, TEXT_OFFSET_Y_TITLE, tooltipHeight))
        .style("fill", isExport ? country1Color : country2Color)
        .text(`${bt.year} ` + (isExport ? "Export" : "Import"));

      if ($sectors.size > 0) {
        for (let i = 0; i < sectorStrings.length; i++) {
          let sector = tradeYearBySectors?.get(bt.year)?.filter((d) => {
            return d.product.name == sectorStrings[i];
          })[0];
          tooltip
            .append("text")
            .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
            .attr(
              "y",
              getTooltipY(
                e.layerY,
                TEXT_OFFSET_Y_BASE + (i + 1) * TEXT_OFFSET_Y_INCRE,
                tooltipHeight
              )
            )
            .text(
              `${sectorStrings[i]}: ${
                isExport
                  ? formatter(sector?.export_value ?? 0)
                  : formatter(sector?.import_value ?? 0)
              }`
            );
        }
        tooltip
          .append("text")
          .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
          .attr(
            "y",
            getTooltipY(
              e.layerY,
              TEXT_OFFSET_Y_BASE +
                (sectorStrings.length + 1) * TEXT_OFFSET_Y_INCRE,
              tooltipHeight
            )
          )
          .style("font-weight", "bold")
          .text(
            `Selected Total:  ${
              isExport ? formatter(bt.export_value) : formatter(bt.import_value)
            }`
          );
      } else {
        tooltip
          .append("text")
          .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
          .attr(
            "y",
            getTooltipY(
              e.layerY,
              TEXT_OFFSET_Y_BASE + TEXT_OFFSET_Y_INCRE,
              tooltipHeight
            )
          )
          .text(
            ($sectors.size == 0 ? "Total: " : "Selected Total: ") +
              `${
                isExport
                  ? formatter(bt.export_value)
                  : formatter(bt.import_value)
              }`
          );

        tooltip
          .append("text")
          .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
          .attr(
            "y",
            getTooltipY(
              e.layerY,
              TEXT_OFFSET_Y_BASE + 2 * TEXT_OFFSET_Y_INCRE,
              tooltipHeight
            )
          )
          .text("Sectors: All");
      }
    };
  }

  function mouseOverBar(bt: BilateralTradeYear): (e: any) => void {
    return (e: any) => {
      let tooltip = d3.select("#line-chart-tooltip");
      let netValue = bt.export_value - bt.import_value;

      tooltip
        .append("rect")
        .attr("id", "tooltip-rect")
        .attr("width", TOOLTIP_RECT_WIDTH)
        .attr("height", TOOLTIP_RECT_HEIGHT_BASE)
        .attr("x", getTooltipX(e.layerX, TOOLTIP_OFFSET))
        .attr(
          "y",
          getTooltipY(e.layerY, TOOLTIP_OFFSET, TOOLTIP_RECT_HEIGHT_BASE)
        );

      tooltip
        .append("text")
        .attr("class", "title")
        .attr("id", "tooltip-text1")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_TITLE, TOOLTIP_RECT_HEIGHT_BASE)
        )
        .style("fill", netValue < 0 ? deficit : surplus)
        .text(`${bt.year} ` + (netValue < 0 ? "Deficit" : "Surplus"));

      tooltip
        .append("text")
        .attr("id", "tooltip-text2")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
        .attr(
          "y",
          getTooltipY(
            e.layerY,
            TEXT_OFFSET_Y_BASE + TEXT_OFFSET_Y_INCRE,
            TOOLTIP_RECT_HEIGHT_BASE
          )
        )
        .text(
          ($sectors.size > 0 ? "Selected " : "") +
            `Total: ${formatter(Math.abs(bt.export_value - bt.import_value))}`
        );
    };
  }

  function mouseMove(): (e: any) => void {
    return (e: any) => {
      d3.select("#tooltip-rect")
        .attr("x", getTooltipX(e.layerX, TOOLTIP_OFFSET))
        .attr(
          "y",
          getTooltipY(e.layerY, TOOLTIP_OFFSET, TOOLTIP_RECT_HEIGHT_BASE)
        );
      d3.select("#tooltip-text1")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_TITLE, TOOLTIP_RECT_HEIGHT_BASE)
        );
      d3.select("#tooltip-text2")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X))
        .attr(
          "y",
          getTooltipY(
            e.layerY,
            TEXT_OFFSET_Y_BASE + TEXT_OFFSET_Y_INCRE,
            TOOLTIP_RECT_HEIGHT_BASE
          )
        );
    };
  }

  function mouseOut(): (e: any) => void {
    return (e: any) => {
      d3.select("#line-chart-tooltip").selectAll("rect").remove();
      d3.select("#line-chart-tooltip").selectAll("text").remove();
    };
  }

  // range([height - MARGIN, MARGIN + MARGIN_TOP])
  $: getNetValueBarY = (bt: BilateralTradeYear) => {
    if (bt.export_value < bt.import_value) {
      // deficit
      if (maxNetValue < 0) {
        // straight from the top
        return MARGIN + MARGIN_TOP;
      } else {
        return yScaleNetValues(0);
      }
    } else {
      // surplus
      if (minNetValue > 0) {
        // straight from the bottom
        return yScaleNetValues(bt.export_value - bt.import_value);
      } else {
        return yScaleNetValues(bt.export_value - bt.import_value);
      }
    }
  };

  $: getNetValueBarHeight = (bt: BilateralTradeYear) => {
    if (bt.export_value < bt.import_value) {
      if (maxNetValue < 0) {
        // straight from the top
        return (
          yScaleNetValues(bt.export_value - bt.import_value) -
          MARGIN -
          MARGIN_TOP
        );
      } else {
        return (
          yScaleNetValues(bt.export_value - bt.import_value) -
          yScaleNetValues(0)
        );
      }
    } else {
      // surplus
      if (minNetValue > 0) {
        // straight from the bottom
        return (
          height - MARGIN - yScaleNetValues(bt.export_value - bt.import_value)
        );
      } else {
        return (
          yScaleNetValues(0) -
          yScaleNetValues(bt.export_value - bt.import_value)
        );
      }
    }
  };
</script>

<div
  id="line-chart"
  class="viz-section"
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  <svg {width} {height}>
    {#if tradeYearGrossValues.length > 0}
      <text
        class="chart-header"
        x={width / 2 + 10}
        y={MARGIN - 5}
        text-anchor="middle">Trade Over Time</text
      >
      <g class="brush" bind:this={brushElem} />
      {#if !isBrushing}
        <rect
          class="timebar"
          x={xScale($years[0]) - 12}
          y={44}
          width="24"
          height={height - 44 - MARGIN > 0 ? height - 44 - MARGIN : 0}
          fill="rgba(0,0,0,0.2)"
        />
      {/if}
      <g
        id="xAxis"
        bind:this={xAxisElem}
        transform={`translate(${0},${height - MARGIN})`}
      >
        <line
          id="xAxisLine"
          x1={MARGIN_LEFT}
          x2={width - MARGIN_RIGHT}
          y1="0"
          y2="0"
          stroke="rgba(0,0,0,0.7)"
          stroke-width="1"
        />
      </g>
      <g
        id="yAisLeft"
        bind:this={y1AxisElem}
        transform={`translate(${MARGIN_LEFT},${0})`}
      />
      <g
        id="yAisRight"
        bind:this={y2AxisElem}
        transform={`translate(${width - MARGIN_RIGHT},${0})`}
      />
      <g id="legendLeft" transform="translate(10,6)">
        <circle
          class="circ1"
          cx="20"
          cy="10"
          r="5"
          fill={country1Color}
          stroke="rgba(0,0,0,0)"
          stroke-width="2"
        />
        <text x="30" y="15" font-size="13" text-anchor="start"
          >Export {`to ${locationData.get(country2)?.name}` ?? ""}</text
        >
        <circle
          class="circ2"
          cx="20"
          cy="25"
          r="5"
          fill={country2Color}
          stroke="rgba(0,0,0,0)"
          stroke-width="2"
        />
        <text x="30" y="30" font-size="13" text-anchor="start"
          >Import {`from ${locationData.get(country2)?.name}` ?? ""}</text
        >
      </g>
      <g
        id="legendRight"
        transform={`translate(${width - 3 * MARGIN_RIGHT + 30},6)`}
      >
        <rect
          class="deficit"
          x="15"
          y="5"
          width="10"
          height="10"
          fill={deficit}
          opacity="0.6"
        />
        <text x="30" y="15" font-size="13" text-anchor="start"
          >Trade Deficit</text
        >
        <rect
          class="surplus"
          x="15"
          y="20"
          width="10"
          height="10"
          fill={surplus}
          opacity="0.6"
        />
        <text x="30" y="30" font-size="13" text-anchor="start"
          >Trade Surplus</text
        >
      </g>
      <g id="net-values-group">
        {#if maxNetValue > 0 && minNetValue < 0}
          <line
            id="zeroline"
            x1={MARGIN_LEFT}
            x2={width - MARGIN_RIGHT}
            y1={yScaleNetValues(0)}
            y2={yScaleNetValues(0)}
            stroke="rgba(0,0,0,0.7)"
            stroke-width="1"
          />
        {/if}
        {#each tradeYearGrossValues as bt (bt.year)}
          <rect
            x={xScale(bt.year) - BAND_WIDTH / 2}
            width={BAND_WIDTH}
            y={getNetValueBarY(bt)}
            height={getNetValueBarHeight(bt) > 0 ? getNetValueBarHeight(bt) : 0}
            fill={bt.export_value < bt.import_value ? deficit : surplus}
            stroke={$years.includes(bt.year)
              ? "rgba(0,0,0,1)"
              : "rgba(0,0,0,0)"}
            opacity="0.6"
            on:click={updateYear(bt.year)}
            on:keydown={() => {}}
            on:keypress
            on:click={updateYear(bt.year)}
            on:focus
            on:blur
            on:mouseover={mouseOverBar(bt)}
            on:mousemove={mouseMove()}
            on:mouseout={mouseOut()}
          />
        {/each}
      </g>
      <g class="country1-group country-group">
        <path
          bind:this={country1Line}
          fill="none"
          stroke={country1Color}
          stroke-width="2"
        />
        {#each tradeYearGrossValues as bt (bt.year)}
          <circle
            class="circ1"
            cx={xScale(bt.year)}
            cy={yScaleGrossValues(bt.export_value)}
            r={$years.includes(bt.year)
              ? 8
              : 7}
            fill={country1Color}
            stroke={$years.includes(bt.year)
              ? "rgba(0,0,0,1)"
              : "#666666"}
            stroke-width="1"
            on:click={updateYear(bt.year)}
            on:keydown={() => {}}
            on:keypress
            on:click={updateYear(bt.year)}
            on:focus
            on:blur
            on:mouseover={mouseOverCircle(bt, true)}
            on:mouseout={mouseOut()}
          />
        {/each}
      </g>
      <g class="country2-group country-group">
        <path
          bind:this={country2Line}
          fill="none"
          stroke={country2Color}
          stroke-width="2"
        />
        {#each tradeYearGrossValues as bt (bt.year)}
          <circle
            cx={xScale(bt.year)}
            cy={yScaleGrossValues(bt.import_value)}
            r={$years.includes(bt.year)
              ? "7"
              : "6"}
            fill={country2Color}
            stroke={$years.includes(bt.year)
              ? "rgba(0,0,0,1)"
              : "#666666"}
            stroke-width="1"
            on:click={updateYear(bt.year)}
            on:keydown={() => {}}
            on:keypress
            on:click={updateYear(bt.year)}
            on:focus
            on:blur
            on:mouseover={mouseOverCircle(bt, false)}
            on:mouseout={mouseOut()}
          />
        {/each}
      </g>
      <g />
      <g id="line-chart-tooltip" class="tooltip" />''
    {:else}
      <text
        in:fade
        x={width / 2}
        y={height / 2}
        alignment-baseline="central"
        text-anchor="middle">No valid data for this pair.</text
      >
    {/if}
  </svg>
  <!-- <p>{formatter(tradeYearTotals.export_value ?? 0)}</p>
  <p>{formatter(tradeYearTotals.import_value ?? 0)}</p>
  <p>Loading data...</p> -->
</div>

<style>
  .country-group circle {
    cursor: pointer;
    outline:none;
    transition: cx, cy 0.3s ease-in-out;
    /* stroke:white; */
  }

  .surplus {
    fill: "#66c2a5";
  }

  .deficit {
    fill: "#fc8d62";
  }

  rect {
    cursor: pointer;
    outline:none;
    transition: all 0.4s ease;
  }
</style>
