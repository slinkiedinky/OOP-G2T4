"use client"
import dynamic from 'next/dynamic'
import { useState } from 'react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import '@fullcalendar/common/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false })

export default function AdminCalendar({ initialEvents = [] }){
  const [events, setEvents] = useState(initialEvents)

  function handleDateSelect(selectInfo){
    const title = prompt('Event title')
    if(title){
      const newEvent = { id: String(Date.now()), title, start: selectInfo.startStr, end: selectInfo.endStr }
      setEvents(prev => [...prev, newEvent])
    }
  }

  function handleEventClick(clickInfo){
    if(confirm(`Delete event '${clickInfo.event.title}'?`)){
      setEvents(prev => prev.filter(e => e.id !== clickInfo.event.id))
    }
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      selectable={true}
      editable={true}
      events={events}
      select={handleDateSelect}
      eventClick={handleEventClick}
      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
    />
  )
}
