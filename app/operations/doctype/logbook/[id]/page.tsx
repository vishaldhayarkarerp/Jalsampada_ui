// app/operations/doctype/logbook/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm, FormProvider, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'

import { DynamicField } from '@/components/DynamicField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'


// -----------------------------------------------------------------------------
// Schema & Types
// -----------------------------------------------------------------------------
const logbookSchema = z
  .object({
    start_pump: z.boolean(),
    start_datetime: z.string().datetime().optional(),
    stop_pump: z.boolean(),
    stop_datetime: z.string().datetime().optional(),

    lis_name: z.string().min(1, 'LIS Name is required'),
    operator_id: z.string().optional(),
    operator_id_1: z.string().optional(),

    stage: z.string().optional(),
    operator_name: z.string().optional(),
    operator_name_1: z.string().optional(),

    entry_date: z.string(),
    status: z.enum(['Running', 'Stopped']),

    primary_list: z.array(z.any()),
    secondary_list: z.array(z.any()),

    pump_stop_reason: z.string().optional(),
    specify: z.string().optional(),

    amended_from: z.string().optional(),
  })
  .refine(
    (data) => data.start_pump || data.stop_pump,
    {
      message: 'Please select at least Start Pump or Stop Pump',
      path: ['start_pump'],
    }
  )

type LogbookForm = z.infer<typeof logbookSchema>

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------
export default function LogbookDocumentPage() {
  const params = useParams()
  const router = useRouter()

  const docName = params.id as string  // document name (e.g. LOG-2025-00001)
  const isNew = docName === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [initialData, setInitialData] = useState<Partial<LogbookForm>>({})

  const form = useForm<LogbookForm>({
    resolver: zodResolver(logbookSchema),
    defaultValues: {
      entry_date: format(new Date(), 'yyyy-MM-dd'),
      status: 'Running',
      start_pump: false,
      stop_pump: false,
      primary_list: [],
      secondary_list: [],
    },
    mode: 'onChange',
  })

    const { handleSubmit, watch, reset, formState: { isSubmitting, errors } } = form

  // Watch fields for conditional rendering
  const startPump = watch('start_pump')
  const stopPump = watch('stop_pump')
  const pumpStopReason = watch('pump_stop_reason')


        // Load existing document
  useEffect(() => {
    if (isNew) {
      setLoading(false)
      return
    }

    const fetchDocument = async () => {
      try {
        setLoading(true)
        // Replace with real API call:
        // const response = await fetch(`/api/logbook/${docName}`)
        // const data = await response.json()

        // Mock data for development
        await new Promise(r => setTimeout(r, 900))
        
        const mockData: Partial<LogbookForm> = {
          start_pump: true,
          start_datetime: new Date().toISOString(),
          lis_name: 'LIS-MAH-01',
          operator_id: 'user-123',
          operator_name: 'John Doe',
          stage: 'STG-02',
          entry_date: format(new Date(), 'yyyy-MM-dd'),
          status: 'Running',
        }

        reset(mockData)
        setInitialData(mockData)
      } catch (err) {
        toast.error('Failed to load logbook document', {
          description: err instanceof Error ? err.message : 'Unknown error'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [isNew, docName, reset])

        const onSubmit: SubmitHandler<LogbookForm> = async (data) => {
    try {
      // Replace with real API call:
      // if (isNew) {
      //   await fetch('/api/logbook', { method: 'POST', body: JSON.stringify(data) })
      // } else {
      //   await fetch(`/api/logbook/${docName}`, { method: 'PUT', body: JSON.stringify(data) })
      // }

      console.log('Saving document:', { name: docName, ...data })

      toast.success(isNew ? 'Logbook Created' : 'Logbook Updated', {
        description: isNew
          ? 'New logbook entry has been successfully created'
          : `Document ${docName} has been updated`,
      })

      if (isNew) {
        router.push('/operations/doctype/logbook')
      }
    } catch (err) {
      toast.error('Failed to save logbook', {
        description: err instanceof Error ? err.message : 'Please try again'
      })
    }
  }

            if (loading) {
    return (
      <div className="container max-w-5xl py-12">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading document...
          </CardContent>
        </Card>
      </div>
    )
  }

    
    
      return (
    <div className="container max-w-5xl py-8 mx-auto">
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">
            {isNew ? 'New Logbook Entry' : `Logbook ${docName}`}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

              {/* Pump Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8">
                <div>
                  <DynamicField
                    field={{
                      type: 'Check',
                      name: 'start_pump',
                      label: '▶️ Start Pump',
                    }}
                  />
                </div>
                {startPump && (
                  <DynamicField
                    field={{
                      type: 'DateTime',
                      name: 'start_datetime',
                      label: 'Pump Start Date and Time',
                      required: true,
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8">
                <div>
                  <DynamicField
                    field={{
                      type: 'Check',
                      name: 'stop_pump',
                      label: '🟥 Stop Pump',
                    }}
                  />
                </div>
                {stopPump && (
                  <DynamicField
                    field={{
                      type: 'DateTime',
                      name: 'stop_datetime',
                      label: 'Pump Stop Date and Time',
                      required: true,
                    }}
                  />
                )}
              </div>

              {/* Main Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DynamicField
                  field={{
                    type: 'Link',
                    name: 'lis_name',
                    label: 'LIS Name',
                    options: 'Lift Irrigation Scheme',
                    required: true,
                  }}
                />

                {startPump && (
                  <DynamicField
                    field={{
                      type: 'Link',
                      name: 'operator_id',
                      label: 'Operator ID (Start)',
                      options: 'User',
                    }}
                  />
                )}

                {stopPump && (
                  <DynamicField
                    field={{
                      type: 'Link',
                      name: 'operator_id_1',
                      label: 'Operator ID (Stop)',
                      options: 'User',
                    }}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DynamicField
                  field={{
                    type: 'Link',
                    name: 'stage',
                    label: 'Stage / Sub Scheme',
                    options: 'Stage No',
                  }}
                />

                {startPump && (
                  <DynamicField
                    field={{
                      type: 'Data',
                      name: 'operator_name',
                      label: 'Operator Name (Start)',
                    }}
                  />
                )}

                {stopPump && (
                  <DynamicField
                    field={{
                      type: 'Data',
                      name: 'operator_name_1',
                      label: 'Operator Name (Stop)',
                    }}
                  />
                )}
              </div>

              {/* Entry & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DynamicField
                  field={{
                    type: 'Date',
                    name: 'entry_date',
                    label: 'Entry Date',
                  }}
                />

                <DynamicField
                  field={{
                    type: 'Select',
                    name: 'status',
                    label: 'Status',
                    options: 'Running\nStopped',
                  }}
                />
              </div>

              {/* Child Tables */}
              {(startPump || stopPump) && (
                <div className="space-y-10 pt-6 border-t">
                  <DynamicField
                    field={{
                      type: 'Table',
                      name: 'primary_list',
                      label: 'Logbook Primary Pump List',
                      options: 'Logbook Primary Pump List',
                    }}
                  />

                  <DynamicField
                    field={{
                      type: 'Table',
                      name: 'secondary_list',
                      label: 'Logbook Secondary Pump List',
                      options: 'Logbook Secondary Pump List',
                    }}
                  />
                </div>
              )}

              {/* Stop Reason */}
              {stopPump && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <DynamicField
                    field={{
                      type: 'Link',
                      name: 'pump_stop_reason',
                      label: 'Pump Stop Reason',
                      options: 'Pump Stop Reasons',
                    }}
                  />

                  {pumpStopReason === 'Other' && (
                    <DynamicField
                      field={{
                        type: 'Small Text',
                        name: 'specify',
                        label: 'Specify',
                      }}
                    />
                  )}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-4 pt-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : isNew
                    ? 'Create Logbook'
                    : 'Update Logbook'}
                </Button>
              </div>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  )
}