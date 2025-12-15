import React, { createContext } from 'react';



  export const Context = createContext();

const CommereContext = ({children}) => {
  return (
    <Context.Provider value={{}}>
        {children}
    </Context.Provider>
  )
}

export default CommereContext