<script lang="ts">
  import * as d3 from "d3";
  import { count, treemap } from "d3";
  import { type Location, Product, BilateralTradeYear } from "../models/models";

  const formatter = (val: number) => d3.format("$.2s")(val).replace(/G/, "B");

  export let data: {
    country1: Location | null;
    country2: Location | null;
    valueField: string;
    productColorScale: d3.ScaleOrdinal<string, string, never> | null;
    drilldownBilateralForYear: Map<number, Map<number, BilateralTradeYear[]>>;
  };

  let {
    country1,
    country2,
    valueField,
    productColorScale,
    drilldownBilateralForYear,
  } = data;
  $: ({ drilldownBilateralForYear, valueField, productColorScale, country1, country2 } = data);

  // export let country1: Location | null;
  // export let country2: Location | null;
  // export let valueField: string;

  let width: number;
  let height: number;
  let treemapElem: SVGGElement;

  // $: bilaterals =
  //   bilateralDataForYear?.get(country1?.id ?? 0)?.get(country2?.id ?? 0) ??
  //   null;

  $: bilaterals =
    drilldownBilateralForYear?.get(country1?.id ?? 0)?.get(country2?.id ?? 0) ??
    null;

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
          // export_value: d3.sum(value, (d) => d.export_value),
          // import_value: d3.sum(value, (d) => d.import_value),
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
      let leaves =
        treemapRoot.leaves() as d3.HierarchyNode<BilateralTradeYear>[];
      treemapRoot.sum((d: any) => Math.max(0, d[valueField]));
      d3.treemap().tile(d3.treemapSquarify).size([width, height]).padding(2)(
        treemapRoot
      );
      d3.select(treemapElem)
        .selectAll(".leaf")
        .data(leaves)
        .join("rect")
        .attr("class", "leaf")
        .transition()
        .attr("transform", (d: any) => `translate(${d.x0},${d.y0})`)
        .attr("width", (d: any) => d.x1 - d.x0)
        .attr("height", (d: any) => d.y1 - d.y0)
        .attr("fill", (d) =>
          productColorScale
            ? productColorScale(d.data?.product?.parent?.name ?? "")
            : "white"
        );

      d3.select(treemapElem)
        .selectAll(".label")
        .data(leaves.filter((d: any) => d.x1 - d.x0 > 40 && d.y1 - d.y0 > 10))
        .join("text")
        .attr("class", "label")
        .transition()
        .attr("transform", (d: any) => `translate(${d.x0 + 3},${d.y0 + 3})`)
        .attr("alignment-baseline", "hanging")
        .attr("fill", "white")
        .attr("font-size", (d: any) => Math.max((d.x1 - d.x0) / 15, 8))
        .text((d) => d.data?.product.name?.substring(0, 40) ?? "");
      d3.select(treemapElem)
        .selectAll(".label-num")
        .data(leaves.filter((d: any) => d.x1 - d.x0 > 40 && d.y1 - d.y0 > 30))
        .join("text")
        .attr("class", "label-num")
        .transition()
        .attr(
          "transform",
          (d: any) =>
            `translate(${d.x0 + 5},${
              d.y0 + 1 + Math.max((d.x1 - d.x0) / 10, 8)
            })`
        )
        .attr("alignment-baseline", "hanging")
        .attr("fill", "white")
        .attr("font-size", (d: any) => Math.max((d.x1 - d.x0) / 15, 8) - 1)
        .attr("font-weight", 300)
        .text((d: any) => formatter(d.data[valueField]) ?? "");
    }
  }
</script>

<div class="viz-section" bind:clientWidth={width} bind:clientHeight={height}>
  <svg>
    <g class="treemap" bind:this={treemapElem} />
  </svg>
</div>

<style>
  svg {
    width: 100%;
    height: 100%;
    margin: 0;
  }
</style>
