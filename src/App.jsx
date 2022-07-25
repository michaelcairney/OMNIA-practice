import { useEffect } from 'react';
import useConnector from './useConnector';
import useEnigma from './useEnigma';
import BarChart from './BarChart';

function App() {
  const { doc } = useConnector(
    '062116f1-826d-4db5-9b13-042674f252e9',
  );
  // const { qlikObject, qlikData } = useEnigma(doc, 'qEqbcMm');
  // const salesData = useEnigma(doc, 'JcJvj').qlikData;
  // const otherBarchart = useEnigma(doc, 'qEqbcMm').qlikData;
  const data = useEnigma(doc, 'CrBqBTP').qlikData;
  if (doc && data) {
    return (
      <>
        <BarChart data={data} />
      </>
    );
  }
}

export default App;
