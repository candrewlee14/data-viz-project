<script lang="ts">
  import * as d3 from "d3";
  import { sectors, showExport, years } from "../global/store";
  import { BilateralTradeYear, Product, type Location } from "../models/models";

  const formatter = (val: number) => d3.format("$.3s")(val).replace(/G/, "B");

  export let data: {
    country1: Location | null;
    country2: Location | null;
    productColorScale: d3.ScaleOrdinal<string, string, never> | null;
    drilldownBilateral: Map<number, Map<number, BilateralTradeYear[]>> | null;
    locationData: Map<number, Location>;
    productData: Map<number, Product>;
    loadingDrilldown: boolean;
  };

  let {
    country1,
    country2,
    productColorScale,
    drilldownBilateral,
    loadingDrilldown,
    locationData,
    productData,
  } = data;
  $: ({
    drilldownBilateral,
    productColorScale,
    country1,
    country2,
    loadingDrilldown,
    locationData,
    productData,
  } = data);

  // let treeMapTooltip: Tooltip = new Tooltip({
  //   width: 800,
  //   height: 400,
  //   groupId: "treemap-tooltip",
  //   countryColorScale: null,
  //   productColorScale: productColorScale
  // })

  $: innerDrilldownBilateral = drilldownBilateral?.get(country2?.id ?? 0);

  $: allInnerDataUnagg = $years
    .map((year) => innerDrilldownBilateral?.get(year) ?? new Array())
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
              location_id: country1,
              partner_id: country2,
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

  $: sumExport = d3.sum(
    innerDataAll,
    (v: BilateralTradeYear) => v.export_value
  ) as number;

  $: sumImport = d3.sum(
    innerDataAll,
    (v: BilateralTradeYear) => v.import_value
  ) as number;

  $: bilaterals =
    $sectors.size == 0
      ? innerDataAll
      : Array.from(
          d3
            .rollup(
              allInnerDataUnagg.filter((d) =>
                $sectors.has(d.product.parent_id)
              ),
              (v) =>
                v.reduce(
                  (acc, b) => {
                    acc.export_value += b.export_value;
                    acc.import_value += b.import_value;
                    return acc;
                  },
                  new BilateralTradeYear(locationData, productData, {
                    location_id: country1,
                    partner_id: country2,
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

  // export let country1: Location | null;
  // export let country2: Location | null;

  interface LeafNode {
    data: BilateralTradeYear;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  }

  const TOOLTIP_OFFSET = 10;
  const TOOLTIP_RECT_WIDTH_BASE = 140;
  const TOOLTIP_RECT_WIDTH_INCRE = 25;
  const TOOLTIP_RECT_HEIGHT = 90;
  const TEXT_OFFSET_X = 20;
  const TEXT_OFFSET_Y_BASE = 28;
  const TEXT_OFFSET_Y_INCRE = 15;

  let width: number = 0;
  let height: number = 0;
  let treemapElem: SVGGElement;

  let leaves: LeafNode[] = new Array();

  $: if (bilaterals && bilaterals.length > 0) {
    let bls = [];
    if ($sectors.size == 1) {
      let v = $sectors.entries().next().value[1] as number;
      console.log(v);
      let bl = new BilateralTradeYear(new Map(), new Map(), {
        location_id: country1,
        partner_id: country2,
        product_id: v,
        year: 0,
        export_value: 0,
        import_value: 0,
      });
      bl.product = new Product({
        product_id: v,
        name: "Sector",
        level: -1,
        parent_id: -1,
      });
      // it is necessary to set this as null for stratify to consider it the parent
      // @ts-ignore
      bl.product.parent_id = null;
      bls.push(bl);
    } else {
      let bl = new BilateralTradeYear(new Map(), new Map(), {
        location_id: country1,
        partner_id: country2,
        product_id: -1,
        year: 0,
        export_value: 0,
        import_value: 0,
      });
      bl.product = new Product({
        product_id: -1,
        name: "All",
        level: -1,
        parent_id: -1,
      });

      // it is necessary to set this as null for stratify to consider it the parent
      // @ts-ignore
      bl.product.parent_id = null;
      bls.push(bl);

      let bl_grouped = d3.group(bilaterals, (v) => v.product?.parent_id ?? -1);
      if (bl_grouped.size > 1) {
        for (let [key, value] of bl_grouped) {
          let bl = new BilateralTradeYear(new Map(), new Map(), {
            location_id: country1,
            partner_id: country2,
            product_id: key,
            year: 0,
            export_value: 0,
            import_value: 0,
          });
          bl.product = new Product({
            product_id: key,
            name: "Something",
            level: 0,
            parent_id: -1,
          });
          bls.push(bl);
        }
      }
    }

    bls = bls.concat(bilaterals);
    // console.log(bls);

    let treemapRoot = d3
      .stratify()
      .id((d: any) => d.product?.id)
      .parentId((d: any) => d.product?.parent_id)(bls);
    treemapRoot.sum((d: any) =>
      Math.max(0, d[$showExport ? "export_value" : "import_value"])
    );
    d3.treemap().tile(d3.treemapBinary).size([width, height]).padding(2)(
      treemapRoot
    );
    // @ts-ignore
    leaves = treemapRoot.leaves() as LeafNode[];
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
    if (eventY + TOOLTIP_RECT_HEIGHT < 350) {
      return eventY + offsetY;
    } else {
      return eventY + offsetY - TOOLTIP_RECT_HEIGHT;
    }
  }

  function mouseOver(bt: BilateralTradeYear): (e: any) => void {
    return (e: any) => {

      // determine the length of the bt.product.name
      // and then choose the width of the tooltip rect

      let tooltip = d3.select("#treemap-tooltip");
      let tooltipWidth =
        TOOLTIP_RECT_WIDTH_BASE + $years.length * TOOLTIP_RECT_WIDTH_INCRE;

      tooltip
        .append("rect")
        .attr("id", "tooltip-rect")
        .attr("width", tooltipWidth)
        .attr("height", TOOLTIP_RECT_HEIGHT)
        .attr("x", getTooltipX(e.layerX, TOOLTIP_OFFSET, tooltipWidth))
        .attr("y", getTooltipY(e.layerY, TOOLTIP_OFFSET));

      // Product
      tooltip
        .append("text")
        .attr("class", "treemap")
        .attr("id", "tooltip-text1")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr("y", getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE))
        .style("font-weight", "bold")
        .text(`${bt.product.name}`);

      // Sector
      tooltip
        .append("text")
        .attr("class", "treemap")
        .attr("id", "tooltip-text2")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + TEXT_OFFSET_Y_INCRE)
        )
        .text(`Sector: ${bt.product?.parent?.name ?? ""}`);

      // Export/Import
      tooltip
        .append("text")
        .attr("class", "treemap")
        .attr("id", "tooltip-text3")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 2 * TEXT_OFFSET_Y_INCRE)
        )
        .text(
          ($showExport ? "Export: " : "Import: ") +
            `${formatter($showExport ? bt.export_value : bt.import_value)}`
        );

      // Share
      tooltip
        .append("text")
        .attr("class", "treemap")
        .attr("id", "tooltip-text4")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 3 * TEXT_OFFSET_Y_INCRE)
        )
        .text(
          `Share: ${d3.format(".2%")(
            $showExport
              ? bt.export_value / sumExport
              : bt.import_value / sumImport
          )}`
        );

      // Years
      tooltip
        .append("text")
        .attr("class", "treemap")
        .attr("id", "tooltip-text5")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 4 * TEXT_OFFSET_Y_INCRE)
        )
        .text(
          ($years.length > 1 ? "Years: " : "Year: ") + `${$years.join(", ")}`
        );
    };
  }

  function mouseMove(): (e: any) => void {
    return (e: any) => {
      // Determine the tooltipWidth

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
      d3.select("#tooltip-text5")
        .attr("x", getTooltipX(e.layerX, TEXT_OFFSET_X, tooltipWidth))
        .attr(
          "y",
          getTooltipY(e.layerY, TEXT_OFFSET_Y_BASE + 4 * TEXT_OFFSET_Y_INCRE)
        );
    };
  }

  function mouseLeave(): (e: any) => void {
    return (e: any) => {
      d3.select("#treemap-tooltip").selectAll("rect").remove();
      d3.select("#treemap-tooltip").selectAll("text").remove();
    };
  }
</script>

<div
  class="viz-section-full"
  bind:clientWidth={width}
  bind:clientHeight={height}
>
  <svg>
    <g class="treemap" bind:this={treemapElem}>
      {#each leaves as leaf (leaf.data.product_id)}
        {#if $years.length > 0 && leaf.x1 != NaN && leaf.x0 != NaN && leaf.y0 != NaN && leaf.y1 != NaN}
          <rect
            class="leaf"
            transform={`translate(${leaf.x0},${leaf.y0})`}
            width={leaf.x1 - leaf.x0}
            height={leaf.y1 - leaf.y0}
            fill={productColorScale
              ? productColorScale(leaf.data?.product?.parent?.name ?? "")
              : "white"}
            on:keydown={() => {}}
            on:click={() => {
              if (
                leaf.data?.product?.parent &&
                $sectors.has(leaf.data?.product?.parent?.id)
              ) {
                sectors.update((s) => {
                  s.delete(leaf.data?.product?.parent?.id ?? -1);
                  console.log(s);
                  return s;
                });
              } else if (leaf.data?.product?.parent != null) {
                sectors.update((s) => {
                  s.add(leaf.data?.product?.parent?.id ?? -1);
                  console.log(s);
                  return s;
                });
              }
            }}
            on:focus
            on:mouseover={mouseOver(leaf.data)}
            on:mousemove={mouseMove()}
            on:mouseleave={mouseLeave()}
          />
          {#if leaf.x1 - leaf.x0 > 40 && leaf.y1 - leaf.y0 > 10}
            <text
              class="label"
              transform={`translate(${leaf.x0 + 3},${leaf.y0 + 3})`}
              alignment-baseline="hanging"
              font-size={Math.max((leaf.x1 - leaf.x0) / 15, 8)}
              on:focus
              on:mouseover={mouseOver(leaf.data)}
              on:mousemove={mouseMove()}
              on:mouseleave={mouseLeave()}
            >
              {leaf.data?.product.name?.substring(0, 40) ?? ""}
            </text>
          {/if}
          {#if leaf.x1 - leaf.x0 > 40 && leaf.y1 - leaf.y0 > 30}
            <text
              class="label-num"
              transform={`translate(${leaf.x0 + 5},${
                leaf.y0 + 1 + Math.max((leaf.x1 - leaf.x0) / 10, 8)
              })`}
              alignment-baseline="hanging"
              font-size={Math.max((leaf.x1 - leaf.x0) / 15, 8) - 1}
              font-weight="300"
              on:focus
              on:mouseover={mouseOver(leaf.data)}
              on:mousemove={mouseMove()}
              on:mouseleave={mouseLeave()}
            >
              {formatter(
                $showExport ? leaf.data.export_value : leaf.data.import_value
              )}
            </text>
          {/if}
        {/if}
      {/each}
    </g>
    <g id="treemap-tooltip" class="tooltip" />
    {#if (bilaterals?.length ?? 0) === 0}
      <rect
        x="0"
        y="0"
        {width}
        {height}
        fill={loadingDrilldown
          ? "rgba(255,255,255, 0.9)"
          : "rgba(255,255,255,1)"}
      />
      <text
        x={width / 2}
        y={height / 2}
        alignment-baseline="central"
        text-anchor="middle">{loadingDrilldown ? "Loading..." : "No Data"}</text
      >
    {/if}
  </svg>
</div>

<style lang="scss">
  svg {
    width: 100%;
    height: 100%;
    margin: 0;
  }
  .treemap text {
    transition: all 0.4s ease;
  }
  .treemap rect {
    transition: all 0.4s ease;
  }
</style>
