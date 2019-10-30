import React, { createContext, useContext, useReducer, useMemo } from 'react'
import axios from 'axios'

const StateContext = createContext()
const DispatchContext = createContext()
const ConfigContext = createContext()

const initialState = {}
const defaultConfig = {
  method: 'POST',
  url: '/api/upload',
  headers: {
    'Content-Type': 'multipart/form-data'
  },
  data: {}
}

const uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  })
}

const reducer = (state, { type, payload }) => {
  switch (type) {
    case 'ADD_UPLOAD':
      return {
        ...state,
        [payload.id]: payload
      }
    case 'UPDATE_UPLOAD':
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          ...payload
        }
      }
    case 'CANCEL_UPLOAD': {
      const upload = state[payload.id]
      if (upload && upload.abortController) {
        upload.abortController.cancel()
      }
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          cancelled: true
        }
      }
    }
    case 'CANCEL_ALL_UPLOADS': {
      return Object.fromEntries(
        Object.entries(state).map(([id, upload]) => {
          const complete = upload.progress === 100
          if (!complete && upload.abortController) {
            upload.abortController.cancel()
            return [
              id, {
                ...upload,
                cancelled: true
              }
            ]
          }
          return [id, upload]
        })
      )
    }
    default: {
      const errorMessage = `Unknown action: ${action.type}`
      throw new Error(errorMessage)
    }
  }
}

export const UploadMangerProvider = ({ config, children }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const contextConfig = useMemo(() => ({
    ...defaultConfig,
    ...config
  }), [config, defaultConfig])

  return (
    <ConfigContext.Provider value={contextConfig}>
      <DispatchContext.Provider value={dispatch}>
        <StateContext.Provider value={state}>
          {children}
        </StateContext.Provider>
      </DispatchContext.Provider>
    </ConfigContext.Provider>
  )
}

export const useUploadManagerConfig = () => useContext(ConfigContext)
export const useUploadManagerDispatch = () => useContext(DispatchContext)
export const useUploadManagerState = () => useContext(StateContext)

export const MultiUploadInput = (props) => {
  const config = useUploadManagerConfig()
  const dispatch = useUploadManagerDispatch()

  const handleChange = async (event) => {
    event.preventDefault()
    const { files } = event.target

    await Promise.all(Array.from(files).map(async file => {
      const abortController = axios.CancelToken.source();
      const id = uuid()

      const formData = new FormData()
      for (const [key, value] of Object.entries(config.data)) {
        formData.append(key, value)
      }
      formData.append('id', id)
      formData.append('file', file)

      try {
        // START UPLOAD
        dispatch({
          type: 'ADD_UPLOAD',
          payload: {
            id,
            file,
            abortController,
            cancelled: false,
            progress: 0
          }
        })

        const { url, data, ...otherConfig } = config

        const request = await axios.post(url, formData, {
          ...otherConfig,
          cancelToken: abortController.token,
          onUploadProgress: (event) => {
            // Record Upload Progress
            dispatch({
              type: 'UPDATE_UPLOAD',
              payload: {
                id,
                progress: Math.round((event.loaded * 100) / event.total)
              }
            })
          }
        })
      } catch (error) {
        if (axios.isCancel(error)) {
          // The request has been canceled by the user
          // So we can ignore it
          return
        }

        // Record Upload Error
        dispatch({
          type: 'UPDATE_UPLOAD',
          payload: {
            id,
            error
          }
        })
      }
    }))
  }

  return (
    <input 
      {...props}
      type='file'
      multiple='multiple'
      onChange={handleChange}
    />
  )
}
