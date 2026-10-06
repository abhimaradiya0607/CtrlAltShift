import React from 'react'
import AddNewButton from '@/features/dashboard/components/add-new-button'
import AddNewRepoButton from '@/features/dashboard/components/add-repo-button'
import EmptyState from '@/components/ui/empty-state'

const page = () => {
  const playgrounds:any = [];
  return (
    <div className='flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 w-full'>
        <AddNewButton/>
        <AddNewRepoButton/>

      </div>
      <div className='mt-10 flex flex-col justify-center items-center w-full'>
        {
          playgrounds && playgrounds.length ===0?(<EmptyState title='No playgrounds found' description='Create a new project to get started' imagesrc='/empty-state.svg'/>):(
            //todo: add the playgrounds here
            <p>Playgrounds</p>
          )
        }
      </div>
    </div>
  )
}

export default page