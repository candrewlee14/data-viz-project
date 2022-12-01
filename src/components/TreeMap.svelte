<script lang="ts">
  import * as d3 from "d3";
  import { sectors, showExport, years } from "../global/store";
  import { BilateralTradeYear, Product, type Location } from "../models/models";

  const formatter = (val: number) => d3.format("$.3s")(val).replace(/G/, "B");
  const uid = `O-${Math.random().toString(16).slice(2)}`;

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

  const TREEMAP_VIZ_WIDTH = 800;
  const TREEMAP_VIZ_HEIGHT = 400;

  const TOOLTIP_OFFSET = 10;

  const TOOLTIP_RECT_WIDTH_BASE = 120;
  const TOOLTIP_RECT_WIDTH_INCRE = 25;
  const TOOLTIP_RECT_HEIGHT = 90;

  const TEXT_OFFSET_X = 20;
  const TEXT_OFFSET_Y_BASE = 28;
  const TEXT_OFFSET_Y_INCRE = 15;

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

  interface LeafNode {
    data: BilateralTradeYear;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  }

  let width: number = 0;
  let height: number = 0;
  let treemapElem: SVGGElement;

  let leaves: LeafNode[] = new Array();

  $: if (bilaterals && bilaterals.length > 0) {
    let bls = [];
    if ($sectors.size == 1) {
      let v = $sectors.entries().next().value[1] as number;
      // console.log(v);
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
    // // console.log(bls);

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
    if (eventY + TOOLTIP_RECT_HEIGHT < height) {
      return eventY + offsetY;
    } else {
      return eventY + offsetY - TOOLTIP_RECT_HEIGHT;
    }
  }

  function mouseOver(bt: BilateralTradeYear): (e: any) => void {
    return (e: any) => {
      let tooltip = d3.select("#treemap-tooltip");
      let tooltipWidth = Math.max(
        TOOLTIP_RECT_WIDTH_BASE + $years.length * TOOLTIP_RECT_WIDTH_INCRE,
        TOOLTIP_RECT_WIDTH_BASE + 10 + (bt.product.name.length - 20) * 8
      );

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

  function mouseMove(bt: BilateralTradeYear): (e: any) => void {
    return (e: any) => {
      let tooltipWidth = Math.max(
        TOOLTIP_RECT_WIDTH_BASE + $years.length * TOOLTIP_RECT_WIDTH_INCRE,
        TOOLTIP_RECT_WIDTH_BASE + 10 + (bt.product.name.length - 20) * 8
      );

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

  function onClick(bt: BilateralTradeYear): (e: any) => void {
    return (e: any) => {
      if (bt?.product?.parent && $sectors.has(bt?.product?.parent?.id)) {
        sectors.update((s) => {
          s.delete(bt?.product?.parent?.id ?? -1);
          // console.log(s);
          return s;
        });
      } else if (bt?.product?.parent != null) {
        sectors.update((s) => {
          s.add(bt?.product?.parent?.id ?? -1);
          // console.log(s);
          return s;
        });
      }
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
      {#each leaves as leaf, i (leaf.data.product_id)}
        {#if $years.length > 0}
          <g
            class="treemap-inner"
            transform={`translate(${leaf.x0},${leaf.y0})`}
          >
            {#if leaf.x1 - leaf.x0 > 0 && leaf.y1 - leaf.y0 > 0}
              <rect
                class="leaf"
                width={leaf.x1 - leaf.x0}
                height={leaf.y1 - leaf.y0}
                fill={productColorScale
                  ? productColorScale(leaf.data?.product?.parent?.name ?? "")
                  : "white"}
                on:keydown={() => {}}
                on:click={onClick(leaf.data)}
                on:focus
                on:mouseover={mouseOver(leaf.data)}
                on:mousemove={mouseMove(leaf.data)}
                on:mouseleave={mouseLeave()}
              />
            {/if}
            {#if leaf.x1 - leaf.x0 > 3 && leaf.y1 - leaf.y0 > 0}
              <clipPath id={`${uid}-clip-${i}`}>
                <rect
                  width={leaf.x1 - leaf.x0 - 3}
                  height={leaf.y1 - leaf.y0}
                />
              </clipPath>
            {/if}
            {#if leaf.y1 - leaf.y0 > 15}
              <text
                class="label"
                clip-path={`url(${new URL(
                  `#${uid}-clip-${i}`,
                  window.location.href
                )})`}
                transform={`translate(4,5)`}
                alignment-baseline="hanging"
                on:keydown={() => {}}
                on:click={onClick(leaf.data)}
                on:focus
                on:mouseover={mouseOver(leaf.data)}
                on:mousemove={mouseMove(leaf.data)}
                on:mouseleave={mouseLeave()}
              >
                {leaf.data?.product.name?.substring(0, 40) ?? ""}
              </text>
            {/if}
            {#if leaf.y1 - leaf.y0 > 35}
              <text
                class="label-num"
                clip-path={`url(${new URL(
                  `#${uid}-clip-${i}`,
                  window.location.href
                )})`}
                transform={`translate(4,${23})`}
                alignment-baseline="hanging"
                font-weight="300"
                on:keydown={() => {}}
                on:click={onClick(leaf.data)}
                on:focus
                on:mouseover={mouseOver(leaf.data)}
                on:mousemove={mouseMove(leaf.data)}
                on:mouseleave={mouseLeave()}
              >
                {formatter(
                  $showExport ? leaf.data.export_value : leaf.data.import_value
                )}
              </text>
            {/if}
          </g>
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
        text-anchor="middle"
        >{loadingDrilldown
          ? "Loading..."
          : "No valid data for this pair."}</text
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
    font-size: 12px;
  }
  .treemap-inner {
    transition: transform 0.4s ease;
  }
  .treemap rect {
    transition: all 0.4s ease;
  }
</style>
