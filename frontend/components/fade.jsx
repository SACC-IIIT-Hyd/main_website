// @client

import React, { useState, useEffect } from 'react';

function Fade({ children }) {
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div style={{
      transition: 'opacity 1s',
      opacity: isVisible ? 1 : 0
    }}>
      {children}
    </div>
  );
}

export default Fade;