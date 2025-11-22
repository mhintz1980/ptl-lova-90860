import { useApp } from "../../store";
import { useMemo } from "react";
import { STAGES } from "../../types";
import { format, startOfWeek, addWeeks, isSameWeek, endOfWeek } from "date-fns";

export function CapacityForecast() {
  const { pumps } = useApp();

  const weeks = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start
    return Array.from({ length: 4 }).map((_, i) => {
      const weekStart = addWeeks(start, i);
      return {
        start: weekStart,
        end: endOfWeek(weekStart, { weekStartsOn: 1 }),
        label: `Week of ${format(weekStart, "MMM d")}`,
      };
    });
  }, []);

  const matrix = useMemo(() => {
    // Initialize matrix: { [Stage]: { [WeekIndex]: count } }
    const data: Record<string, number[]> = {};
    STAGES.forEach(stage => {
      data[stage] = [0, 0, 0, 0];
    });

    pumps.forEach(pump => {
      if (!pump.promiseDate) return;
      const date = new Date(pump.promiseDate);

      weeks.forEach((week, index) => {
        if (isSameWeek(date, week.start, { weekStartsOn: 1 })) {
          if (data[pump.stage]) {
            data[pump.stage][index]++;
          }
        }
      });
    });

    return data;
  }, [pumps, weeks]);

  const CAPACITY_LIMIT = 20;

  return (
    <div className="capacity-forecast font-sans">
      <div className="flex justify-between items-center mb-6 no-print">
        <h1 className="text-2xl font-bold">Capacity Forecast</h1>
        <button
          onClick={() => window.print()}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Print Report
        </button>
      </div>

      <div className="print:block">
        <div className="mb-8 border-b-2 border-black pb-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter">
            4-Week Capacity Forecast
          </h2>
          <p className="text-gray-600 mt-2">Generated: {format(new Date(), "PPP")}</p>
        </div>

        <table className="w-full text-left border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-3 uppercase text-sm">Department</th>
              {weeks.map((week, i) => (
                <th key={i} className="border border-black p-3 uppercase text-sm text-center">
                  {week.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STAGES.map((stage) => {
              if (stage === "CLOSED" || stage === "QUEUE") return null; // Skip non-production stages? Or keep them? PRD says "Stage vs Week". I'll keep them but maybe Queue is less relevant for "Capacity". Let's keep all for now.

              return (
                <tr key={stage}>
                  <td className="border border-black p-3 font-bold">{stage}</td>
                  {weeks.map((_, index) => {
                    const count = matrix[stage][index];
                    const isOverCapacity = count > CAPACITY_LIMIT;

                    return (
                      <td
                        key={index}
                        className={`border border-black p-3 text-center ${isOverCapacity ? "bg-black text-white font-bold" : ""}`}
                      >
                        {count}
                        {isOverCapacity && <span className="block text-xs font-normal text-red-300">OVER CAP</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 text-sm text-gray-500">
          <p>* Capacity Limit defined as {CAPACITY_LIMIT} units per week.</p>
          <p>* Cells highlighted in black indicate potential bottlenecks.</p>
        </div>
      </div>
    </div>
  );
}
