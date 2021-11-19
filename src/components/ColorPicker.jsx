import React from 'react';

function ColorPicker({kind, setColor, value}) {
  const id = kind + '-color';
  const capitalized = kind[0].toUpperCase() + kind.substring(1);
  return (
    <div className="vstack">
      <label htmlFor={id}>{capitalized} Color</label>
      <input
        id={id}
        type="color"
        value={value}
        onChange={e => setColor(kind, e.target.value)}
      />
    </div>
  );
}

export default ColorPicker;
