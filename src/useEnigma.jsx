import { useEffect, useState } from 'react';

export default function useEnigma(doc, objectId) {
  // Define states
  const [qlikObject, setQlikObject] = useState(null);
  const [qlikData, setQlikData] = useState([]);
  const [qlikLabels, setQlikLabels] = useState([]);
  const [filterData, setFilterData] = useState([]);
  const [sessionLayout, setSessionLayout] = useState(null);

  // GET CHART DATA
  useEffect(() => {
    if (doc && objectId) {
      // Function for extracting the data from the qlik engine
      const getData = async () => {
        // Grab the chart with its object ID
        const qObject = await doc.getObject(objectId);

        // Set original object to state
        setQlikObject(qObject);

        // Clear any previous selections on rerender
        await qObject.clearSelections('/qHyperCubeDef');

        // Define original object layout (I guess not needed)
        const layout = await qObject.getLayout();

        // Obtain properties of the original object
        const properties = await qObject.getProperties();

        // Create a session object
        const transientObject = await doc.createSessionObject(
          properties,
        );

        // Get the layout of the session object
        const transientLayout = await transientObject.getLayout();

        // Get the desired data
        const hyperCubeData = await transientObject.getHyperCubeData(
          '/qHyperCubeDef',
          [
            {
              qTop: 0,
              qLeft: 0,
              qWidth: transientLayout.qHyperCube.qSize.qcx,
              qHeight: transientLayout.qHyperCube.qSize.qcy,
            },
          ],
        );

        setSessionLayout(transientLayout);
        setQlikData(hyperCubeData[0].qMatrix);

        // Set up listener for changes to the session object from the Qlik app
        transientObject.on('changed', () =>
          transientObject
            .getLayout()
            .then((res) => setSessionLayout(res)),
        );
      };
      getData();
    }
  }, [doc, objectId]);

  // APPLY CHART METADATA
  useEffect(() => {
    if (sessionLayout) {
      // Function for applying the data from the qlik engine whenever the session object layout recieves changes
      const applyData = async () => {
        // Get the dimension name
        const dimension =
          sessionLayout.qHyperCube.qDimensionInfo[0].qFallbackTitle;

        // Get the measure name
        const measure =
          sessionLayout.qHyperCube.qMeasureInfo[0].qFallbackTitle;

        // Set data and labels to state

        setQlikLabels({ dimension, measure });
      };
      applyData();
    }
  }, [sessionLayout]);

  return { qlikData, qlikLabels, qlikObject };
}
