// components/form/DynamicField.tsx
'use client'
import React from 'react'
import { useFormContext } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon, Upload, X, Star } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { SelectContent } from '@/components/ui/select'
import { SelectItem } from '@/components/ui/select'
import { SelectTrigger } from '@/components/ui/select'
import { SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover } from '@/components/ui/popover'
import { PopoverContent } from '@/components/ui/popover'
import { PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { FormField } from './DynamicFormComponent'

import { TableField } from "./TableField"; 
import { LinkField } from "./LinkField";// your custom link picker if exists

// ────────────────────────────────────────────────────────────────
// Types (using FormField from DynamicFormComponent)
export type FieldType = FormField['type']

export interface DynamicFieldProps {
  field: FormField
}

// ────────────────────────────────────────────────────────────────
// Helper components
const RequiredMark = () => <span className="text-destructive ml-1">*</span>

const FieldError = ({ error }: { error?: any }) =>
  error ? <p className="text-sm text-destructive mt-1.5">{error.message}</p> : null

const FieldDescription = ({ text }: { text?: string }) =>
  text ? <p className="text-sm text-muted-foreground mt-1.5">{text}</p> : null

// ────────────────────────────────────────────────────────────────
export function DynamicField({ field }: DynamicFieldProps) {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext()

  const error = errors[field.name]

  const getRules = () => {
    const rules: any = {}
    if (field.required) rules.required = `${field.label} is required`
    if (field.min !== undefined) rules.min = { value: field.min, message: `≥ ${field.min}` }
    if (field.max !== undefined) rules.max = { value: field.max, message: `≤ ${field.max}` }
    if (field.type === 'Percent') {
      rules.min = { value: 0, message: '0–100' }
      rules.max = { value: 100, message: '0–100' }
    }
    return rules
  }

  switch (field.type) {
    // ── Basic text ───────────────────────────────────────
    case 'Small Text':
    case 'Text':
    case 'Int':
    case 'Float':
    case 'Currency':
    case 'Percent':
    case 'Color':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <Input
            type={field.type === 'Color' ? 'color' : (field.type === 'Int' || field.type === 'Float') ? 'number' : 'text'}
            step={field.type === 'Percent' ? '0.01' : field.step}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            {...register(field.name, getRules())}
          />
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    case 'Password':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <Input type="password" {...register(field.name, getRules())} />
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    // ── Multiline ─────────────────────────────────────────
    case 'Long Text':
    case 'Code':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <Textarea
            rows={field.rows ?? (field.type === 'Code' ? 10 : 4)}
            placeholder={field.placeholder}
            className={field.type === 'Code' ? 'font-mono' : ''}
            {...register(field.name, getRules())}
          />
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    // ── Select ────────────────────────────────────────────
    case 'Select':
      const options =
        typeof field.options === 'string'
          ? field.options.split('\n').map(v => ({ label: v.trim(), value: v.trim() }))
          : field.options || []

      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <Select {...register(field.name, getRules())}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {options.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    // ── Checkbox ──────────────────────────────────────────
    case 'Check':
      return (
        <div className="flex items-start gap-2">
          <Checkbox id={field.name} {...register(field.name)} />
          <div className="grid gap-0.5 leading-none">
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label}
              {field.required && <RequiredMark />}
            </Label>
            <FieldDescription text={field.description} />
            <FieldError error={error} />
          </div>
        </div>
      )

    // ── Date / Time ───────────────────────────────────────
    case 'Date':
    case 'DateTime':
    case 'Time':
      const value = watch(field.name)
      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value
                  ? format(
                      new Date(value),
                      field.type === 'Date'
                        ? 'PPP'
                        : field.type === 'DateTime'
                        ? 'PPP p'
                        : 'p'
                    )
                  : field.placeholder || 'Pick date...'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={date => setValue(field.name, date?.toISOString(), { shouldDirty: true })}
              />
            </PopoverContent>
          </Popover>
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    // ── File ──────────────────────────────────────────────
    case 'Attach':
      const file = watch(field.name)
      const fileInputRef = React.useRef<HTMLInputElement>(null)

      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={e => {
              const selected = e.target.files?.[0]
              if (selected) setValue(field.name, selected, { shouldDirty: true })
            }}
          />

          {!file ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose file
            </Button>
          ) : (
            <div className="flex items-center gap-3 rounded border bg-muted/40 px-3 py-2 text-sm">
              <span className="flex-1 truncate">{(file as File).name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive/90"
                onClick={() => setValue(field.name, null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    // ── Readonly ──────────────────────────────────────────
    case 'Read Only':
      return (
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">{field.label}</Label>
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
            {watch(field.name) ?? '—'}
          </div>
          <FieldDescription text={field.description} />
        </div>
      )

    // ── Section ───────────────────────────────────────────
    case 'Section Break':
      return (
        <div className="py-6">
          <h3 className="text-lg font-semibold tracking-tight">{field.label}</h3>
          {field.description && (
            <p className="mt-1.5 text-sm text-muted-foreground">{field.description}</p>
          )}
        </div>
      )

    // ── Rating (simple stars) ─────────────────────────────
    case 'Rating':
      const current = watch(field.name) ?? 0

      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1
              return (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    'text-2xl transition-colors',
                    current >= value ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-400'
                  )}
                  onClick={() => setValue(field.name, value, { shouldDirty: true })}
                >
                  <Star className="h-6 w-6 fill-current" />
                </button>
              )
            })}
          </div>
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    // ── Table / Link ──────────────────────────────────────
    case 'Table':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <TableField
            field={field}
            control={control}
            register={register}
            errors={errors}
          />
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    case 'Link':
      return (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            {field.required && <RequiredMark />}
          </Label>
          <LinkField field={field} control={control} error={error} />
          <FieldDescription text={field.description} />
          <FieldError error={error} />
        </div>
      )

    default:
      return (
        <div className="text-amber-600 text-sm italic">
          Field type not implemented: <strong>{field.type}</strong>
        </div>
      )
  }
}