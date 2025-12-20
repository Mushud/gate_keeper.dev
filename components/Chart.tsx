"use client";

import { memo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const HighchartsReact = dynamic(() => import("highcharts-react-official"), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
    </div>
  ),
});

interface ChartProps {
  options: any;
}

// Memoized chart component to prevent unnecessary re-renders
const Chart = memo(({ options }: ChartProps) => {
  const [Highcharts, setHighcharts] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Lazy load Highcharts only when chart is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (chartRef.current) {
      observer.observe(chartRef.current);
    }

    return () => {
      if (chartRef.current) {
        observer.unobserve(chartRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      import("highcharts").then((module) => {
        setHighcharts(module.default);
      });
    }
  }, [isVisible]);

  if (!isVisible || !Highcharts) {
    return (
      <div ref={chartRef} className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return <HighchartsReact highcharts={Highcharts} options={options} />;
});

Chart.displayName = "Chart";

export default Chart;
