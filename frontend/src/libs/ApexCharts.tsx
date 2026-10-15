import dynamic from "next/dynamic";

// react-apexcharts touches `window` on import, so it must stay client-only.
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default Chart;
