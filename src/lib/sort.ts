import { Pump, Priority, Stage } from "../types";
import { STAGE_SEQUENCE } from "./stage-constants";

export type SortField =
  | "default"
  | "priority"
  | "promiseDate"
  | "po"
  | "customer"
  | "model"
  | "stage"
  | "value"
  | "serial"
  | "last_update";

export type SortDirection = "asc" | "desc";

const PRIORITY_WEIGHT: Record<Priority, number> = {
  Urgent: 5,
  Rush: 4,
  High: 3,
  Normal: 2,
  Low: 1,
};

const STAGE_WEIGHT: Record<Stage, number> = STAGE_SEQUENCE.reduce(
  (acc, stage, index) => ({ ...acc, [stage]: index }),
  {} as Record<Stage, number>
);

const getPromiseDate = (pump: Pump) => pump.promiseDate ?? pump.forecastEnd ?? "";

const toTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const compareDefault = (a: Pump, b: Pump) => {
  const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  if (priorityDiff !== 0) return priorityDiff;

  const promiseDiff = toTimestamp(getPromiseDate(a)) - toTimestamp(getPromiseDate(b));
  if (promiseDiff !== 0) return promiseDiff;

  return toTimestamp(a.last_update) - toTimestamp(b.last_update);
};

const compareStrings = (a?: string | number, b?: string | number) => {
  const stringA = (a ?? "").toString().toLowerCase();
  const stringB = (b ?? "").toString().toLowerCase();
  if (stringA < stringB) return -1;
  if (stringA > stringB) return 1;
  return 0;
};

const compareNumeric = (a?: number, b?: number) => {
  const numA = a ?? 0;
  const numB = b ?? 0;
  return numA - numB;
};

const getComparableValue = (pump: Pump, field: SortField) => {
  switch (field) {
    case "priority":
      return PRIORITY_WEIGHT[pump.priority];
    case "promiseDate":
      return toTimestamp(getPromiseDate(pump));
    case "po":
      return pump.po;
    case "customer":
      return pump.customer;
    case "model":
      return pump.model;
    case "stage":
      return STAGE_WEIGHT[pump.stage] ?? 0;
    case "value":
      return pump.value;
    case "serial":
      return pump.serial;
    case "last_update":
      return toTimestamp(pump.last_update);
    default:
      return 0;
  }
};

export function sortPumps(
  pumps: Pump[],
  field: SortField,
  direction: SortDirection
): Pump[] {
  const sorted = [...pumps];
  sorted.sort((a, b) => {
    let result: number;

    if (field === "default") {
      result = compareDefault(a, b);
      return result;
    } else {
      const valueA = getComparableValue(a, field);
      const valueB = getComparableValue(b, field);

      if (typeof valueA === "number" && typeof valueB === "number") {
        result = compareNumeric(valueA, valueB);
      } else {
        result = compareStrings(valueA as string, valueB as string);
      }
    }

    return direction === "desc" ? -result : result;
  });

  return sorted;
}
