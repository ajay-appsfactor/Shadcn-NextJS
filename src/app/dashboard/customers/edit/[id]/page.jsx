'use client'

import { useParams } from 'next/navigation'

export default function EditCustomerPage() {
  const params = useParams()
  const id = params.id

  return (
    <div>
      <h1>Edit Customer - ID: {id}</h1>
    </div>
  )
}
