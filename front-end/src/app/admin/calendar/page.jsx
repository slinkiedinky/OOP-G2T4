// "use client"
// import React from 'react'
// import AdminCalendar from '../../../../components/AdminCalendar'
// import RequireAuth from '../../../components/RequireAuth'

// export default function Page(){
//   const mock = [
//     { id: '1', title: 'Dr. Tan - Consultation', start: new Date().toISOString().slice(0,10) },
//     { id: '2', title: 'Dr. Lim - Surgery', start: new Date(Date.now() + 86400000).toISOString().slice(0,10) }
//   ]

//   return (
//     <RequireAuth>
//       <div style={{width:'100%'}}>
//         <h2>Admin Calendar</h2>
//         <div style={{marginTop:16}}>
//           <AdminCalendar initialEvents={mock} />
//         </div>
//       </div>
//     </RequireAuth>
//   )
// }