import { useEffect, useState } from "react";
import map from "./map.png";

async function fetchAsset() {
  const response = await fetch("http://localhost:8000");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

export function Welcome() {
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAsset()
      .then((data) => setAsset(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="flex items-center justify-center pt-16 pb-4">
      <img src={map} alt="Map" />
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center w-full h-full">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
          Hamiltonian Path
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          A SAT Solver for Hamiltonian Path Problem
        </p>
        <div className="mt-8 flex space-x-4">
          {(() => {
            if (error) {
              return <p className="text-red-500">{error}</p>;
            }
            if (asset) {
              return asset;
            }
            return <p>Loading...</p>;
          })()}
        </div>
      </div>
    </main>
  );
}
