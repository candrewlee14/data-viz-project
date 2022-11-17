<script lang="ts">
  import * as d3 from "d3";
  import { years } from "../stores/store";
  import { type Location, Product, BilateralTradeYear } from "../models/models";

  const formatter = (val: number) => d3.format("$.2s")(val).replace(/G/, "B");

  export let data: {
    country1: Location | null;
    country2: Location | null;
    valueField: string;
    productColorScale: d3.ScaleOrdinal<string, string, never> | null;
    drilldownBilateral: Map<number, Map<number, BilateralTradeYear[]>> | null;
    locationData: Map<number, Location>,
    productData: Map<number, Product>,
    loadingDrilldown: boolean;
  };

  let {
    country1,
    country2,
    valueField,
    productColorScale,
    drilldownBilateral,
    loadingDrilldown,
    locationData,
    productData,
  } = data;
  $: ({
    drilldownBilateral,
    valueField,
    productColorScale,
    country1,
    country2,
    loadingDrilldown,
    locationData,
    productData,
  } = data);

  $: innerDrilldownBilateral = drilldownBilateral?.get(country2?.id ?? 0);

  $: allInnerDataUnagg = ($years.map((year) => innerDrilldownBilateral?.get(year) ?? new Array()).flat() as BilateralTradeYear[]);


  $: bilaterals = Array.from(d3.rollup(allInnerDataUnagg,
    (v) => v.reduce(
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
            })),
    (d) => d.product_id,
  ).values());



  // export let country1: Location | null;
  // export let country2: Location | null;
  // export let valueField: string;

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
    let bls = [bl];

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

      bls = bls.concat(bilaterals);

      let treemapRoot = d3
        .stratify()
        .id((d: any) => d.product?.id)
        .parentId((d: any) => d.product?.parent_id)(bls);
      treemapRoot.sum((d: any) => Math.max(0, d[valueField]));
      d3.treemap().tile(d3.treemapResquarify).size([width, height]).padding(2)(
        treemapRoot
      );
      // @ts-ignore
      leaves = treemapRoot.leaves() as LeafNode[];
    }
  }
</script>

<div class="viz-section" bind:clientWidth={width} bind:clientHeight={height}>
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
          />
          {#if leaf.x1 - leaf.x0 > 40 && leaf.y1 - leaf.y0 > 10}
            <text
              class="label"
              transform={`translate(${leaf.x0 + 3},${leaf.y0 + 3})`}
              alignment-baseline="hanging"
              font-size={Math.max((leaf.x1 - leaf.x0) / 15, 8)}
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
            >
              {formatter(
                valueField === "export_value"
                  ? leaf.data.export_value
                  : leaf.data.import_value
              )}
            </text>
          {/if}
        {/if}
      {/each}
    </g>
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
