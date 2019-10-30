// Example:
// This is how you could use this module!
import React from 'react'
import {
  UploadMangerProvider,
  MultiUploadInput,
  useUploadManagerState,
  useUploadManagerDispatch
} from './index'

const App = () => {
  return (
    <UploadMangerProvider>
      <h1>Example</h1>
      <MultiUploadInput />
      <MultiUploadManagerView />
    </UploadMangerProvider>
  )
}

const MultiUploadManagerView = () => {
  const state = useUploadManagerState()
  const dispatch = useUploadManagerDispatch()
  const uploads = Object.values(state)

  const handleCancel = (event, id) => {
    event.preventDefault()
    dispatch({
      type: 'CANCEL_UPLOAD',
      payload: { id }
    })
  }

  const handleCancelAll = (event) => {
    event.preventDefault()
    dispatch({
      type: 'CANCEL_ALL_UPLOADS'
    })
  }

  return (
    <div>
      <h2>Uploads:</h2>
      <button onClick={handleCancelAll}>Cancel All</button>
      <hr />
      {uploads.map((upload) => {
        const complete = upload.progress === 100
        return (
          <div key={upload.id}>
            <div>Upload: {upload.file.name}</div>
            <div>ID: {upload.id}</div>
            <div>Progress: {upload.progress}</div>
            {complete && <div>Complete!</div>}
            {upload.cancelled && <div>Has been canceled</div>}
            {!upload.cancelled && !complete && <button onClick={(event) => handleCancel(event, upload.id)}>Cancel</button>}
            {upload.error && <div>Some error occured! ({upload.error.message})</div>}
            <hr />
          </div>
        )
      })}

      {!uploads.length && (
        <div>
          Hey Dude Upload Something!
        </div>
      )}

    </div>
  )
}

export default App
