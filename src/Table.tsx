import React, { useState } from 'react'

type TableProps = {
  hidden?: boolean;
  data?: string[];
  selected?: string;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
  title?: string;
}

const Table = ({ hidden = false, data = ['english', 'spanish', 'french'], selected = 'english', setSelected, title }: TableProps) => {
  return (
    <div className={`table-container ${hidden ? 'hidden' : ''}`}>
     {title && <p className='subtitle-header'>{title}</p>}
      <div>
        {data.map((item, index) => (
          <p
            key={index}
            className={`subtitle-options ${selected === item ? 'active' : ''}`}
            onClick={() => setSelected(item)}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

export default Table