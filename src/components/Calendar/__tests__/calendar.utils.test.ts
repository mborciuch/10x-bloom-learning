import { addMonths, addYears, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { vi } from "vitest";
import { canNavigateMonth, generateCalendarDays, getCalendarDateRange, groupSessionsByDate } from "../calendar.utils";
import type { ReviewSessionDto } from "@/types";
import type { SessionsByDate } from "../calendar.types";

const baseDate = new Date("2024-02-15T12:00:00Z");

const createSession = (overrides: Partial<ReviewSessionDto> = {}): ReviewSessionDto => ({
  id: overrides.id ?? crypto.randomUUID(),
  studyPlanId: overrides.studyPlanId ?? "plan-id",
  exerciseTemplateId: overrides.exerciseTemplateId ?? "template-id",
  exerciseLabel: overrides.exerciseLabel ?? "Label",
  reviewDate: overrides.reviewDate ?? new Date(baseDate).toISOString(),
  taxonomyLevel: overrides.taxonomyLevel ?? "remember",
  status: overrides.status ?? "proposed",
  isAiGenerated: overrides.isAiGenerated ?? false,
  isCompleted: overrides.isCompleted ?? false,
  content: overrides.content ?? { questions: ["Q1"], answers: ["A1"] },
  notes: overrides.notes,
  statusChangedAt: overrides.statusChangedAt ?? new Date(baseDate).toISOString(),
  completedAt: overrides.completedAt ?? null,
  createdAt: overrides.createdAt ?? new Date(baseDate).toISOString(),
  updatedAt: overrides.updatedAt ?? new Date(baseDate).toISOString(),
});

describe("calendar.utils", () => {
  describe("generateCalendarDays", () => {
    it("starts the grid on Monday not after the first day of the month", () => {
      const currentMonth = new Date("2024-02-10T00:00:00Z");
      const days = generateCalendarDays(currentMonth, {});

      const firstDay = days[0].date;
      expect(firstDay.getDay()).toBe(1); // Monday
      expect(firstDay.getTime()).toBeLessThanOrEqual(startOfMonth(currentMonth).getTime());
    });

    it("marks days inside the month as current and others as outside", () => {
      const currentMonth = new Date("2024-01-15T00:00:00Z");
      const days = generateCalendarDays(currentMonth, {});

      const daysInMonth = days.filter((day) => day.date.getMonth() === currentMonth.getMonth());
      const daysOutsideMonth = days.filter((day) => day.date.getMonth() !== currentMonth.getMonth());

      expect(daysInMonth.every((day) => day.isCurrentMonth)).toBe(true);
      expect(daysOutsideMonth.every((day) => day.isCurrentMonth === false)).toBe(true);
    });

    it("attaches sessions when their date key matches the day", () => {
      const targetDateKey = "2024-01-10";
      const sessionsByDate: SessionsByDate = {
        [targetDateKey]: [createSession({ id: "s1", exerciseLabel: "Morning review" })],
      };

      const days = generateCalendarDays(new Date("2024-01-01T00:00:00Z"), sessionsByDate);
      const match = days.find((day) => format(day.date, "yyyy-MM-dd") === targetDateKey);

      expect(match?.sessions).toHaveLength(1);
      expect(match?.sessions[0].exerciseLabel).toBe("Morning review");
    });
  });

  describe("groupSessionsByDate", () => {
    it("groups multiple sessions under the same day key", () => {
      const sessions = [
        createSession({ id: "s1", reviewDate: "2024-01-05T08:00:00.000Z" }),
        createSession({ id: "s2", reviewDate: "2024-01-05T16:00:00.000Z" }),
        createSession({ id: "s3", reviewDate: "2024-01-06T09:00:00.000Z" }),
      ];

      const grouped = groupSessionsByDate(sessions);
      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped["2024-01-05"]).toHaveLength(2);
      expect(grouped["2024-01-06"]).toHaveLength(1);
    });

    it("keeps sessions separated when ISO timestamps cross midnight UTC", () => {
      const sessions = [
        createSession({ id: "late", reviewDate: "2024-01-01T23:30:00.000Z" }),
        createSession({ id: "early", reviewDate: "2024-01-02T00:30:00.000Z" }),
      ];

      const grouped = groupSessionsByDate(sessions);
      expect(Object.keys(grouped)).toEqual(["2024-01-01", "2024-01-02"]);
      expect(grouped["2024-01-01"]?.[0].id).toBe("late");
      expect(grouped["2024-01-02"]?.[0].id).toBe("early");
    });
  });

  describe("getCalendarDateRange", () => {
    it("returns a Monday start date and Sunday end date around the month", () => {
      const currentMonth = new Date("2024-03-18T00:00:00Z");

      const { startDate, endDate } = getCalendarDateRange(currentMonth);
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T00:00:00.000Z`);
      const monthStartKey = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const monthEndKey = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      expect(start.getUTCDay()).toBe(1);
      expect(end.getUTCDay()).toBe(0);
      expect(startDate <= monthStartKey).toBe(true);
      expect(endDate >= monthEndKey).toBe(true);
    });
  });

  describe("canNavigateMonth", () => {
    beforeAll(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T00:00:00.000Z"));
    });

    afterAll(() => {
      vi.useRealTimers();
    });

    it("allows navigation exactly 5 years away but blocks beyond", () => {
      const today = new Date("2024-01-15T00:00:00.000Z");
      const exactlyFiveYearsAhead = addYears(today, 5);
      const beyondFiveYearsAhead = addMonths(exactlyFiveYearsAhead, 1);

      const currentForNext = subMonths(exactlyFiveYearsAhead, 1);
      const currentForNextBlocked = subMonths(beyondFiveYearsAhead, 1);

      expect(canNavigateMonth(currentForNext, "next")).toBe(true);
      expect(canNavigateMonth(currentForNextBlocked, "next")).toBe(false);

      const exactlyFiveYearsBack = addYears(today, -5);
      const currentForPrev = addMonths(exactlyFiveYearsBack, 1);
      const beyondFiveYearsBack = subMonths(exactlyFiveYearsBack, 1);

      expect(canNavigateMonth(currentForPrev, "prev")).toBe(true);
      expect(canNavigateMonth(beyondFiveYearsBack, "prev")).toBe(false);
    });
  });
});
