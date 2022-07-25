import enigma from 'enigma.js';
import schema from 'enigma.js/schemas/12.20.0.json';
import { useEffect, useState } from 'react';

// useClikConnect used seperately from useEnigma so that multiple websocket connections aren't created //
export default function useConnector(appId) {
  const [global, setGlobal] = useState([]);
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    // Setup configuration for qlik server url
    const config = {
      host: 'cc-edapps.calibrateconsulting.com',
      isSecure: true,
      appId,
    };

    // Create session object, apply url and create WebSocket connection
    const session = enigma.create({
      schema,
      url: `ws${config.isSecure ? 's' : ''}://${config.host}/app/${
        config.appId
      }`,
      createSocket: (url) => new WebSocket(url),
    });

    // Function to open a session and save qGlobal and qDoc objects in state
    async function connectToQlik() {
      // Open session object
      const qGlobal = await session.open();
      setGlobal(qGlobal);
      // Open doc with app ID
      const qDoc = await qGlobal.openDoc(config.appId);
      setDoc(qDoc);
    }

    connectToQlik();
  }, []);

  return { global, doc };
}
