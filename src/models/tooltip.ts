import * as d3 from "d3";
import type { BilateralTradeYear } from "./models";
import * as ct from "../global/constants";
import { sectors, years } from "../global/store";

class Tooltip {
  svgWidth: number;
  svgHeight: number;
  svgGroupId: string;
  countryColorScale: d3.ScaleOrdinal<number, string, never> | null;
  productColorScale: d3.ScaleOrdinal<string, string, never> | null;
  formatter: any = (val: number) => d3.format("$.3s")(val).replace(/G/, "B");

  constructor(d: any) {
    this.svgWidth = d.width;
    this.svgHeight = d.height;
    this.svgGroupId = d.groupId;
    this.productColorScale = d.productColorScale;
    this.countryColorScale = d.countryColorScale;
  }

  getTooltipX(eventX: number, offsetX: number, tooltipWidth: number): number {
    if (eventX + tooltipWidth < this.svgWidth) {
      return eventX + offsetX;
    } else {
      return eventX + offsetX - tooltipWidth;
    }
  }

  getTooltipY(eventY: number, offsetY: number): number {
    if (eventY + ct.TOOLTIP_RECT_HEIGHT < this.svgHeight) {
      return eventY + offsetY;
    } else {
      return eventY + offsetY - ct.TOOLTIP_RECT_HEIGHT;
    }
  }

  mouseOverBarChart(
    bt: BilateralTradeYear,
    isExport: boolean,
    years: Array<number>
  ): (e: any) => void {
    return (e: any) => {
      let tooltip = d3.select(this.svgGroupId);
      let tooltipWidth =
        ct.TOOLTIP_RECT_WIDTH_BASE + years.length * ct.TOOLTIO_RECT_WIDTH_INC;

      tooltip
        .append("rect")
        .attr("id", "tooltip-rect")
        .attr("width", tooltipWidth)
        .attr("height", ct.TOOLTIP_RECT_HEIGHT)
        .attr("x", this.getTooltipX(e.layerX, ct.TOOLTIP_OFFSET, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TOOLTIP_OFFSET));

      tooltip
        .append("text")
        .attr("class", "title")
        .attr("id", "tooltip-text1")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT1_OFFSET_Y))
        .text(isExport ? "Export" : "Import")
        .style(
          "fill",
          this.countryColorScale
            ? isExport
              ? this.countryColorScale(bt.location_id)
              : this.countryColorScale(bt.partner_id)
            : "black"
        );

      tooltip
        .append("text")
        .attr("id", "tooltip-text2")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT2_OFFSET_Y))
        .text(
          `${bt.product.name}: ${this.formatter(
            isExport ? bt.export_value : bt.import_value
          )}`
        );

      tooltip
        .append("text")
        .attr("id", "tooltip-text3")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT3_OFFSET_Y))
        .text(`Year: ${years.toString()}`);
    };
  }

  mouseOverLineChart(
    bt: BilateralTradeYear,
    isExport: boolean,
    sectorStrings: Array<string>
  ): (e: any) => void {
    return (e: any) => {
      let tooltip = d3.select(this.svgGroupId);
      let tooltipWidth =
        ct.TOOLTIP_RECT_WIDTH_BASE +
        sectorStrings.length * ct.TOOLTIO_RECT_WIDTH_INC;

      tooltip
        .append("rect")
        .attr("id", "tooltip-rect")
        .attr("width", tooltipWidth)
        .attr("height", ct.TOOLTIP_RECT_HEIGHT)
        .attr("x", this.getTooltipX(e.layerX, ct.TOOLTIP_OFFSET, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TOOLTIP_OFFSET));

      tooltip
        .append("text")
        .attr("class", "title")
        .attr("id", "tooltip-text1")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT1_OFFSET_Y))
        .text(isExport ? "Export" : "Import")
        .style(
          "fill",
          this.countryColorScale
            ? isExport
              ? this.countryColorScale(bt.location_id)
              : this.countryColorScale(bt.partner_id)
            : "black"
        );

      tooltip
        .append("text")
        .attr("id", "tooltip-text2")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT2_OFFSET_Y))
        .text(`Year: ${bt.year}, Total: ${isExport ? this.formatter(bt.export_value) : this.formatter(bt.import_value)}`);

      tooltip
        .append("text")
        .attr("id", "tooltip-text3")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT3_OFFSET_Y))
        .text(`Sector: ${sectorStrings}`);
    };
  }

  mouseoverTreemap(
    bt: BilateralTradeYear,
    isExport: boolean,
    years: Array<number>
  ): (e: any) => void {
    return (e: any) => {
      console.log(bt);
      let tooltip = d3.select(this.svgGroupId);
      let tooltipWidth =
        ct.TOOLTIP_RECT_WIDTH_BASE + years.length * ct.TOOLTIO_RECT_WIDTH_INC;

      tooltip
        .append("rect")
        .attr("id", "tooltip-rect")
        .attr("width", tooltipWidth)
        .attr("height", ct.TOOLTIP_RECT_HEIGHT)
        .attr("x", this.getTooltipX(e.layerX, ct.TOOLTIP_OFFSET, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TOOLTIP_OFFSET));

      tooltip
        .append("text")
        .attr("class", "title")
        .attr("id", "tooltip-text1")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT1_OFFSET_Y))
        .text(bt.product.name)
        .style(
          "fill",
          this.productColorScale
            ? this.productColorScale(bt?.product?.parent?.name ?? "")
            : "white"
        );

      tooltip
        .append("text")
        .attr("id", "tooltip-text2")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT2_OFFSET_Y))
        .text(`Year: ${years.toString()}`);

      tooltip
        .append("text")
        .attr("id", "tooltip-text3")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT3_OFFSET_Y));
      // .text(`Sector: ${sectorStrings}`);
    };
  }

  mouseMove(years: Array<number>): (e: any) => void {
    return (e: any) => {
      let tooltipWidth =
        ct.TOOLTIP_RECT_WIDTH_BASE + years.length * ct.TOOLTIO_RECT_WIDTH_INC;
      d3.select("#tooltip-rect")
        .attr("x", this.getTooltipX(e.layerX, ct.TOOLTIP_OFFSET, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TOOLTIP_OFFSET));
      d3.select("#tooltip-text1")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT1_OFFSET_Y));
      d3.select("#tooltip-text2")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT2_OFFSET_Y));
      d3.select("#tooltip-text3")
        .attr("x", this.getTooltipX(e.layerX, ct.TEXT_OFFSET_X, tooltipWidth))
        .attr("y", this.getTooltipY(e.layerY, ct.TEXT3_OFFSET_Y));
    };
  }

  mouseLeave(): (e: any) => void {
    return (e: any) => {
      d3.select(this.svgGroupId).selectAll("rect").remove();
      d3.select(this.svgGroupId).selectAll("text").remove();
    };
  }
}

export { Tooltip };
