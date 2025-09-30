import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker'
import dayjs, {Dayjs} from 'dayjs'

interface DatePickerProps {
  label?: string;
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string | undefined;
  required?: boolean;
}

export function DatePicker({label, value, onChange, error, required}: DatePickerProps) {
  const currentYear = new Date().getFullYear()
  const maxDate = dayjs(new Date(currentYear + 10, 11, 31))

  return (
      <div className="space-y-2">
        {label && (
            <label className="text-sm font-medium text-foreground">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
        )}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
              value={value ? dayjs(value) : null}
              onChange={(newValue: Dayjs | null) =>
                  onChange(newValue ? newValue.toDate() : undefined)
              }
              minDateTime={dayjs()} // 🚀 only allow future dates
              maxDateTime={maxDate}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  helperText: error || undefined, // ✅ error message shown inside
                  InputProps: {
                    sx: {
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    },
                  },
                },
              }}
          />
        </LocalizationProvider>
      </div>
  )
}
