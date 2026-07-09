"use client";
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { SentimentData, SentimentType, SENTIMENT_COLORS } from "@/app/types/sentiment";

const ORDERED: SentimentType[] = ["POSITIVE", "NEGATIVE", "NEUTRAL"];

interface Props {
  data: SentimentData;
  animate?: boolean;
}

export default function Visualization({ data, animate = true }: Props) {
  const lineRef   = useRef<SVGSVGElement>(null);
  const donutRef  = useRef<SVGSVGElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [width, setWidth]         = useState(560);
  const [hovered, setHovered]     = useState<number | null>(null);
  const [tooltip, setTooltip]     = useState<{ x: number; y: number; word: string; sentiment: SentimentType; conf: number } | null>(null);

  /* ── Responsive ───────────────────────────────────── */
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Line / Area Chart ────────────────────────────── */
  useEffect(() => {
    if (!lineRef.current || !data.wordSentiments.length) return;
    const svg = d3.select(lineRef.current);
    svg.selectAll("*").remove();

    const W = width, H = 200;
    const m = { top: 18, right: 18, bottom: 32, left: 42 };
    const iW = W - m.left - m.right;
    const iH = H - m.top - m.bottom;
    const ws = data.wordSentiments;

    svg.attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);

    const defs = svg.append("defs");

    // Gradient per sentiment for area fill
    ORDERED.forEach((s) => {
      const g = defs.append("linearGradient")
        .attr("id", `area-grad-${s}`)
        .attr("x1", "0").attr("y1", "0")
        .attr("x2", "0").attr("y2", "1");
      g.append("stop").attr("offset", "0%").attr("stop-color", SENTIMENT_COLORS[s]).attr("stop-opacity", 0.22);
      g.append("stop").attr("offset", "100%").attr("stop-color", SENTIMENT_COLORS[s]).attr("stop-opacity", 0);
    });

    // Glow filter
    const filter = defs.append("filter").attr("id", "glow").attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    filter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "3").attr("result", "blur");
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    const xScale = d3.scaleLinear().domain([0, Math.max(ws.length - 1, 1)]).range([0, iW]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([iH, 0]);

    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    // Grid
    g.append("g").selectAll("line")
      .data(yScale.ticks(4))
      .enter().append("line")
      .attr("x1", 0).attr("x2", iW)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .attr("stroke", "rgba(255,255,255,0.05)")
      .attr("stroke-dasharray", "3,4");

    // Area fill coloured by sentiment of majority
    const areaGen = d3.area<typeof ws[0]>()
      .x((_, i) => xScale(i))
      .y0(iH)
      .y1(d => yScale(d.confidence))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // One area per sentiment group
    const grouped = ws.reduce((acc, w) => {
      acc[w.sentiment] = acc[w.sentiment] || [];
      acc[w.sentiment].push(w);
      return acc;
    }, {} as Record<string, typeof ws>);

    const dominant = (Object.entries(grouped).sort((a,b) => b[1].length - a[1].length)[0]?.[0] ?? "NEUTRAL") as SentimentType;

    g.append("path")
      .datum(ws)
      .attr("fill", `url(#area-grad-${dominant})`)
      .attr("d", areaGen);

    // Segmented colored line
    for (let i = 0; i < ws.length - 1; i++) {
      const lineG = d3.line<typeof ws[0]>()
        .x((_, idx) => xScale(i + idx))
        .y(d => yScale(d.confidence))
        .curve(d3.curveCatmullRom.alpha(0.5));

      const path = g.append("path")
        .datum([ws[i], ws[i + 1]])
        .attr("fill", "none")
        .attr("stroke", SENTIMENT_COLORS[ws[i].sentiment])
        .attr("stroke-width", 2)
        .attr("opacity", 0.75)
        .attr("d", lineG);

      if (animate) {
        const len = (path.node() as SVGPathElement)?.getTotalLength?.() ?? 100;
        path
          .attr("stroke-dasharray", len)
          .attr("stroke-dashoffset", len)
          .transition().delay(i * 18).duration(300)
          .attr("stroke-dashoffset", 0);
      }
    }

    // Points
    g.selectAll("circle.pt")
      .data(ws)
      .enter().append("circle")
      .attr("class", "pt")
      .attr("cx", (_, i) => xScale(i))
      .attr("cy", d => yScale(d.confidence))
      .attr("r", (_, i) => hovered === i ? 8 : 5)
      .attr("fill", d => SENTIMENT_COLORS[d.sentiment])
      .attr("stroke", "#0b1512")
      .attr("stroke-width", 2)
      .attr("filter", (_, i) => hovered === i ? "url(#glow)" : "none")
      .style("cursor", "pointer")
      .attr("opacity", animate ? 0 : 1)
      .on("mouseover", function (event, d) {
        const i = ws.indexOf(d);
        setHovered(i);
        d3.select(this).attr("r", 8).attr("filter", "url(#glow)");
        const rect = wrapRef.current!.getBoundingClientRect();
        setTooltip({ x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 48, word: d.word, sentiment: d.sentiment, conf: d.confidence });
      })
      .on("mousemove", function (event) {
        const rect = wrapRef.current!.getBoundingClientRect();
        setTooltip(t => t ? { ...t, x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 48 } : null);
      })
      .on("mouseout", function () {
        setHovered(null);
        d3.select(this).attr("r", 5).attr("filter", "none");
        setTooltip(null);
      })
      .transition().delay((_, i) => i * 18 + 60).duration(200)
      .attr("opacity", 1);

    // Y axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(4).tickFormat(d => `${(+d * 100).toFixed(0)}%`))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.08)").attr("x2", iW))
      .call(g => g.selectAll(".tick text").attr("fill", "#4a7a6d").attr("font-size", "10px").attr("font-family", "inherit"));

    // X labels (thinned)
    const step = Math.max(1, Math.ceil(ws.length / Math.floor(iW / 55)));
    g.selectAll("text.xl")
      .data(ws.filter((_, i) => i % step === 0))
      .enter().append("text")
      .attr("class", "xl")
      .attr("x", (_, i) => xScale(i * step))
      .attr("y", iH + 22)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px")
      .attr("fill", "#3a6058")
      .attr("font-family", "inherit")
      .text(d => d.word.length > 9 ? d.word.slice(0, 8) + "\u2026" : d.word);

  }, [data, width, animate, hovered]);

  /* ── Donut Chart ──────────────────────────────────── */
  useEffect(() => {
    if (!donutRef.current || !data.wordSentiments.length) return;
    const svg = d3.select(donutRef.current);
    svg.selectAll("*").remove();

    const SIZE = 90;
    const r = SIZE / 2 - 6;
    svg.attr("width", SIZE).attr("height", SIZE).attr("viewBox", `0 0 ${SIZE} ${SIZE}`);

    const dist = data.wordSentiments.reduce((acc, w) => {
      acc[w.sentiment] = (acc[w.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = ORDERED.filter(s => (dist[s] || 0) > 0).map(s => ({ key: s, value: dist[s] || 0 }));
    const pie = d3.pie<{ key: string; value: number }>().value(d => d.value).sort(null).padAngle(0.04);
    const arc = d3.arc<d3.PieArcDatum<{ key: string; value: number }>>().innerRadius(r * 0.62).outerRadius(r);

    const g = svg.append("g").attr("transform", `translate(${SIZE / 2},${SIZE / 2})`);

    g.selectAll("path")
      .data(pie(pieData))
      .enter().append("path")
      .attr("fill", d => SENTIMENT_COLORS[d.data.key as SentimentType])
      .attr("opacity", 0.85)
      .attr("d", arc)
      .attr("stroke", "#0b1512")
      .attr("stroke-width", 1.5)
      .transition().duration(600).delay((_, i) => i * 120)
      .attrTween("d", function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(i(t)) as string;
      });

    // Center label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("y", -5)
      .attr("font-size", "16px")
      .attr("font-weight", "700")
      .attr("fill", SENTIMENT_COLORS[data.overallSentiment])
      .attr("font-family", "inherit")
      .text(`${(data.confidence * 100).toFixed(0)}%`);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 9)
      .attr("font-size", "7px")
      .attr("fill", "#4a7a6d")
      .attr("font-family", "inherit")
      .attr("letter-spacing", "0.08em")
      .text("CONF");
  }, [data]);

  if (!data.wordSentiments.length) return null;

  const dist = data.wordSentiments.reduce((acc, w) => {
    acc[w.sentiment] = (acc[w.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConf = data.wordSentiments.reduce((s, w) => s + w.confidence, 0) / data.wordSentiments.length;

  return (
    <div className="viz-root" ref={wrapRef}>
      {/* ── Header ── */}
      <div className="viz-header">
        <div className="viz-header-left">
          <span className={`viz-badge viz-badge--${data.overallSentiment.toLowerCase()}`}>
            {data.overallSentiment === "POSITIVE" ? "\u2191" : data.overallSentiment === "NEGATIVE" ? "\u2193" : "\u2192"}
            {" "}{data.overallSentiment}
          </span>
          <span className="viz-meta">{data.wordSentiments.length} words &middot; {(avgConf * 100).toFixed(0)}% avg</span>
        </div>
        <div className="viz-header-right">
          <svg ref={donutRef} />
          <div className="viz-legend">
            {ORDERED.filter(s => (dist[s] || 0) > 0).map(s => (
              <div key={s} className="viz-legend-row">
                <span className="viz-legend-dot" style={{ background: SENTIMENT_COLORS[s] }} />
                <span className="viz-legend-label">{s.slice(0, 3)}</span>
                <span className="viz-legend-count">{dist[s]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Line Chart ── */}
      <div className="viz-chart">
        <svg ref={lineRef} style={{ display: "block", width: "100%", overflow: "visible" }} />
        {tooltip && (
          <div className="viz-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            <span className="viz-tooltip-word">{tooltip.word}</span>
            <span className="viz-tooltip-badge" style={{ color: SENTIMENT_COLORS[tooltip.sentiment] }}>
              {tooltip.sentiment}
            </span>
            <span className="viz-tooltip-conf">{(tooltip.conf * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* ── Word Chips ── */}
      <div className="viz-chips">
        {data.wordSentiments.map((w, i) => (
          <span
            key={`${w.word}-${i}`}
            className={`viz-chip viz-chip--${w.sentiment.toLowerCase()}`}
            title={`${w.sentiment} · ${(w.confidence * 100).toFixed(1)}%`}
          >
            {w.word}
            <span className="viz-chip-conf">{(w.confidence * 100).toFixed(0)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}