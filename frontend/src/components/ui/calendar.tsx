import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2 w-full", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-md transition-colors flex items-center justify-center",
          "hover:bg-primary/20 hover:text-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "!bg-blue-600 dark:!bg-cyan-500 !text-white font-semibold hover:!bg-blue-700 dark:hover:!bg-cyan-600 hover:!text-white focus:!bg-blue-600 focus:!text-white",
        day_today: "bg-surface-alt font-semibold border-2 border-primary",
        day_outside:
          "day-outside text-muted opacity-50",
        day_disabled: "text-muted opacity-30 hover:bg-transparent cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-surface-alt",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };