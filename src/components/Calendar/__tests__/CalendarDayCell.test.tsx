import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarDayCell } from "../CalendarDayCell";
import type { ReviewSessionDto } from "@/types";
import { vi } from "vitest";
import type { ComponentProps } from "react";

vi.mock("../SessionCardMini", () => ({
  SessionCardMini: ({ session }: { session: ReviewSessionDto }) => (
    <div data-testid="session-card">{session.exerciseLabel}</div>
  ),
}));

const baseDate = new Date("2024-01-15T12:00:00Z");

const buildSession = (overrides: Partial<ReviewSessionDto> = {}): ReviewSessionDto => ({
  id: overrides.id ?? crypto.randomUUID(),
  studyPlanId: overrides.studyPlanId ?? "plan-id",
  exerciseTemplateId: overrides.exerciseTemplateId ?? "template-id",
  exerciseLabel: overrides.exerciseLabel ?? "Algebra drills",
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

const createProps = (overrides: Partial<ComponentProps<typeof CalendarDayCell>> = {}) => ({
  date: baseDate,
  sessions: [buildSession()],
  isToday: false,
  isSelected: false,
  isCurrentMonth: true,
  onDayClick: vi.fn(),
  onSessionClick: vi.fn(),
  onQuickComplete: vi.fn().mockResolvedValue(undefined),
  onSessionEdit: vi.fn(),
  onSessionDelete: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("CalendarDayCell", () => {
  it("renders an overflow badge when more than three sessions exist", () => {
    const sessions = Array.from({ length: 4 }, (_, idx) => buildSession({ id: `session-${idx}` }));
    render(<CalendarDayCell {...createProps({ sessions })} />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByTestId("session-card")).toHaveLength(4);
  });

  it("invokes onDayClick for mouse and keyboard interactions", async () => {
    const user = userEvent.setup();
    const onDayClick = vi.fn();
    render(<CalendarDayCell {...createProps({ onDayClick })} />);

    const cell = screen.getByRole("gridcell");
    await user.click(cell);
    cell.focus();
    await user.keyboard("{Enter}");

    expect(onDayClick).toHaveBeenCalledTimes(2);
    expect(onDayClick).toHaveBeenCalledWith(baseDate);
  });

  it("marks the cell as current date when isToday is true", () => {
    render(<CalendarDayCell {...createProps({ isToday: true })} />);

    expect(screen.getByRole("gridcell")).toHaveAttribute("aria-current", "date");
  });
});
